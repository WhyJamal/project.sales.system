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
from plans.models import SubscriptionPlan, OrganizationSubscription, parse_months
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

    Опционально принимает `user_count` — если организация увеличила или
    уменьшила число пользователей (через модалку "+ user" или прямо здесь,
    в форме продления), то именно в момент продления (единственный момент
    списания денег в этой системе) новое количество применяется и
    оплачивается: itog = plan.price + extra_users * product.extra_user_price.

    Если `user_count` не передан — используется `pending_user_count`
    (если он был выставлен ранее) либо текущий `user_count`.
    """
    org_product_id = request.data.get('org_product_id')
    plan_id = request.data.get('plan_id')
    requested_user_count = request.data.get('user_count')

    if not org_product_id or not plan_id:
        return Response({"error": "Не указаны org_product_id или plan_id"}, status=400)

    try:
        months = parse_months(request.data.get('months'))
    except ValueError as e:
        return Response({"error": str(e)}, status=400)

    try:
        org = request.user.organization
        if not org:
            return Response({"error": "Организация не найдена"}, status=404)

        org_product = OrganizationProduct.objects.get(id=org_product_id, organization=org)
        plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)
        wallet = get_or_create_wallet(org)

        if requested_user_count is not None:
            try:
                target_user_count = max(1, int(requested_user_count))
            except (TypeError, ValueError):
                return Response({"error": "user_count butun son bo'lishi kerak."}, status=400)
        elif org_product.pending_user_count is not None:
            target_user_count = org_product.pending_user_count
        else:
            target_user_count = org_product.user_count or 1

        included_users = org_product.product.included_users if org_product.product_id else 1
        extra_user_price = org_product.product.extra_user_price if org_product.product_id else 0
        extra_users = max(0, target_user_count - (included_users or 1))
        total_cost = (plan.price + (extra_user_price * extra_users)) * months

        with transaction.atomic():
            wallet.withdraw(
                total_cost,
                description=(
                    f"Продление подписки: {org_product.title} ({plan.name}), "
                    f"{target_user_count} foydalanuvchi"
                    + (f", {months} мес." if months > 1 else "")
                )
            )

            subscription = OrganizationSubscription.objects.create(
                organization=org,
                plan=plan,
                end_date=timezone.now() + timedelta(days=plan.duration_days * months)
            )

            org_product.subscription = subscription
            org_product.subscription_end_date = subscription.end_date
            org_product.product_price = plan.price
            org_product.user_count = target_user_count
            org_product.pending_user_count = None
            org_product.save(update_fields=[
                'subscription', 'subscription_end_date',
                'product_price', 'user_count', 'pending_user_count',
            ])

            logger.info(
                f"Wallet renew: org={org.name}, plan={plan.name}, "
                f"org_product={org_product.id}, new_end={subscription.end_date}, "
                f"user_count={target_user_count}, total_cost={total_cost}"
            )

        return Response({
            "success": True,
            "new_end_date": subscription.end_date,
            "plan_name": plan.name,
            "wallet_balance": str(wallet.balance),
            "user_count": target_user_count,
            "total_cost": str(total_cost),
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