import hashlib
import logging
from datetime import timedelta

from django.utils import timezone
from django.db import transaction

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from django.conf import settings

from .models import ClickTransaction, PendingPayment
from plans.models import SubscriptionPlan, OrganizationSubscription
from organizations.models import Organization, OrganizationProduct
from products.models import Product
from wallet.views import get_or_create_wallet

logger = logging.getLogger(__name__)

SERVICE_ID = settings.CLICK_SERVICE_ID
SECRET_KEY = settings.CLICK_SECRET_KEY


def verify_click_sign(data: dict, action: int) -> bool:
    sign_string = (
        f"{data['click_trans_id']}"
        f"{data['service_id']}"
        f"{SECRET_KEY}"
        f"{data['merchant_trans_id']}"
    )
    if action == 1:
        sign_string += f"{data.get('merchant_prepare_id', '')}"
    sign_string += f"{data['amount']}{data['action']}{data['sign_time']}"
    expected = hashlib.md5(sign_string.encode('utf-8')).hexdigest()
    return expected == data.get('sign_string', '')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment(request):
    org_id = request.data.get('organization_id')
    plan_id = request.data.get('plan_id')
    product_id = request.data.get('product_id')
    wallet_topup = request.data.get('wallet_topup', False)
    topup_amount = request.data.get('amount')

    try:
        org = Organization.objects.get(inn=org_id)

        if wallet_topup:
            if not topup_amount:
                return Response({"error": "Сумма не указана"}, status=400)
            pending = PendingPayment.objects.create(
                organization=org,
                amount=topup_amount,
                wallet_topup=True,
            )
        else:
            plan = SubscriptionPlan.objects.get(code=plan_id)
            product = Product.objects.get(name=product_id)
            pending = PendingPayment.objects.create(
                organization=org,
                plan=plan,
                product=product,
                amount=plan.price,
                wallet_topup=False,
            )
    except Exception as e:
        return Response({"error": str(e)}, status=400)

    return Response({
        "merchant_trans_id": str(pending.id),
        "amount": pending.amount
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def renew_from_wallet(request):
    """
    Продление подписки OrganizationProduct за счёт баланса кошелька.
    """
    org_product_id = request.data.get('org_product_id')
    plan_id = request.data.get('plan_id')

    if not org_product_id or not plan_id:
        return Response({"error": "Не указаны org_product_id или plan_id"}, status=400)

    try:
        org = request.user.organization
        if not org:
            return Response({"error": "Организация не найдена"}, status=404)

        org_product = OrganizationProduct.objects.get(id=org_product_id, organization=org)
        plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)
        wallet = get_or_create_wallet(org)

        with transaction.atomic():
            wallet.withdraw(
                plan.price,
                description=f"Продление подписки: {org_product.title} ({plan.name})"
            )

            subscription = OrganizationSubscription.objects.create(
                organization=org,
                plan=plan,
                end_date=timezone.now() + timedelta(days=plan.duration_days)
            )

            org_product.subscription = subscription
            org_product.subscription_end_date = subscription.end_date
            org_product.product_price = plan.price
            org_product.save(update_fields=[
                'subscription', 'subscription_end_date',
                'product_price'
            ])

            logger.info(
                f"Wallet renew: org={org.name}, plan={plan.name}, "
                f"org_product={org_product.id}, new_end={subscription.end_date}"
            )

        return Response({
            "success": True,
            "new_end_date": subscription.end_date,
            "plan_name": plan.name,
            "wallet_balance": str(wallet.balance),
        })

    except OrganizationProduct.DoesNotExist:
        return Response({"error": "Продукт не найден"}, status=404)
    except SubscriptionPlan.DoesNotExist:
        return Response({"error": "Тариф не найден"}, status=404)
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        logger.error(f"Renew from wallet error: {e}")
        return Response({"error": "Внутренняя ошибка сервера"}, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def click_prepare(request):
    data = request.data
    logger.info(f"Click PREPARE received: {data}")

    if not verify_click_sign(data, action=0):
        return Response({"error": -1, "error_note": "SIGN CHECK FAILED"})

    click_trans_id = data.get('click_trans_id')
    merchant_trans_id = data.get('merchant_trans_id')
    amount = float(data.get('amount', 0))
    service_id = data.get('service_id')

    try:
        pending = PendingPayment.objects.get(id=int(merchant_trans_id))
    except (PendingPayment.DoesNotExist, ValueError):
        return Response({"error": -5, "error_note": "USER NOT FOUND"})

    expected_amount = float(pending.amount)
    if abs(amount - expected_amount) > 0.01:
        return Response({"error": -2, "error_note": "INCORRECT PARAMETER AMOUNT"})

    if ClickTransaction.objects.filter(
        merchant_trans_id=merchant_trans_id,
        status='completed'
    ).exists():
        return Response({"error": -4, "error_note": "ALREADY PAID"})

    tx, created = ClickTransaction.objects.get_or_create(
        click_trans_id=click_trans_id,
        defaults={
            'service_id': service_id,
            'merchant_trans_id': merchant_trans_id,
            'amount': amount,
            'status': 'pending',
        }
    )

    return Response({
        "click_trans_id": click_trans_id,
        "merchant_trans_id": merchant_trans_id,
        "merchant_prepare_id": tx.id,
        "error": 0,
        "error_note": "Success"
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def click_complete(request):
    data = request.data
    logger.info(f"Click COMPLETE received: {data}")

    if not verify_click_sign(data, action=1):
        return Response({"error": -1, "error_note": "SIGN CHECK FAILED"})

    click_trans_id = data.get('click_trans_id')
    merchant_trans_id = data.get('merchant_trans_id')
    merchant_prepare_id = data.get('merchant_prepare_id')
    click_error = int(data.get('error', 0))

    try:
        tx = ClickTransaction.objects.get(id=merchant_prepare_id)
    except ClickTransaction.DoesNotExist:
        return Response({"error": -6, "error_note": "TRANSACTION NOT FOUND"})

    if tx.status == 'completed':
        return Response({
            "error": -4,
            "error_note": "ALREADY PAID",
            "click_trans_id": click_trans_id,
            "merchant_trans_id": merchant_trans_id,
        })

    if click_error < 0:
        tx.status = 'cancelled'
        tx.error = click_error
        tx.save()
        return Response({
            "error": 0,
            "error_note": "Success",
            "click_trans_id": click_trans_id,
            "merchant_trans_id": merchant_trans_id,
        })

    try:
        with transaction.atomic():
            pending = PendingPayment.objects.get(id=int(merchant_trans_id))
            org = pending.organization

            if pending.wallet_topup:
                wallet = get_or_create_wallet(org)
                wallet.deposit(pending.amount)
                logger.info(f"Wallet deposit: org={org.name}, amount={pending.amount}")
            else:
                plan = pending.plan
                product = pending.product

                subscription = OrganizationSubscription.objects.create(
                    organization=org,
                    plan=plan,
                    end_date=timezone.now() + timedelta(days=plan.duration_days)
                )

                org_product = OrganizationProduct.objects.create(
                    organization=org,
                    product=product,
                    title=f"{org.name} - {plan.name}",
                    product_price=plan.price,
                    subscription=subscription,
                    subscription_end_date=subscription.end_date,
                )
                logger.info(
                    f"Payment completed: org={org.name}, plan={plan.name}, "
                    f"product_url={org_product.product_url}"
                )

            tx.status = 'completed'
            tx.save()

    except PendingPayment.DoesNotExist:
        return Response({"error": -5, "error_note": "PENDING PAYMENT NOT FOUND"})
    except Exception as e:
        logger.error(f"Complete payment error: {e}")
        tx.status = 'failed'
        tx.error = -9
        tx.error_note = str(e)
        tx.save()
        return Response({"error": -9, "error_note": "INTERNAL ERROR"})

    return Response({
        "error": 0,
        "error_note": "Success",
        "click_trans_id": click_trans_id,
        "merchant_trans_id": merchant_trans_id,
        "merchant_confirm_id": tx.id,
    })