import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { Button, Textarea } from "@/shared/components";
import StarRating from "@/shared/components/ui/star-rating";
import { useUserStore } from "@shared/stores/userStore";
import { useApp } from "@app/providers/AppProvider";
import {
  fetchProductReviews,
  fetchReviewSummary,
  submitProductReview,
  ProductReview,
  ReviewSummary,
} from "@/shared/services/productService";

interface Props {
  productId: number;
}

const ProductReviews: React.FC<Props> = ({ productId }) => {
  const { t } = useTranslation("common");
  const { user } = useUserStore();
  const { showToast } = useApp();

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [summary, setSummary] = useState<ReviewSummary>({
    average: 0,
    count: 0,
  });
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // User mavjud review'ini topish
  const myReview = user
    ? reviews.find((r) => r.user === user.id)
    : undefined;

  // Review'ni tahrirlash holati
  const [isEditing, setIsEditing] = useState(false);

  const loadData = async () => {
    setLoading(true);

    try {
      const [reviewsRes, summaryRes] = await Promise.all([
        fetchProductReviews(productId),
        fetchReviewSummary(productId),
      ]);

      setReviews(reviewsRes);
      setSummary(summaryRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // User'ning mavjud review'ini formaga yuklash
  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment);
    } else {
      setRating(0);
      setComment("");
    }
  }, [myReview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating < 1) {
      showToast(t("modals.review.yourRating"), "info");
      return;
    }

    setSubmitting(true);

    try {
      await submitProductReview(productId, rating, comment);

      showToast(
        myReview
          ? t("modals.review.update")
          : t("modals.review.submit"),
        "success"
      );

      // Review yuborilgandan keyin edit holatini yopamiz
      setIsEditing(false);

      // Yangi review'ni serverdan qayta olamiz
      await loadData();
    } catch (err) {
      console.error(err);
      showToast("Не удалось отправить отзыв", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          {t("modals.review.title")}
        </h2>

        {summary.count > 0 && (
          <div className="flex items-center gap-2">
            <StarRating
              value={Math.round(summary.average)}
              readOnly
            />

            <span className="text-gray-700 font-semibold">
              {summary.average}
            </span>

            <span className="text-gray-400 text-sm">
              ({summary.count}{" "}
              {t("modals.review.reviewsCount")})
            </span>
          </div>
        )}
      </div>

      {/* User review / Create review */}
      {user ? (
        myReview && !isEditing ? (
          // ---------------------------------------------
          // USERNING YUBORILGAN REVIEW'I
          // ---------------------------------------------
          <div className="border rounded-xl p-5 mb-8 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-500">
                {t("modals.review.yourReview")}
              </div>

              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsEditing(true)}
              >
                {t("modals.review.update")}
              </Button>
            </div>

            <StarRating
              value={myReview.rating}
              readOnly
              size={28}
            />

            {myReview.comment && (
              <p className="text-gray-600 text-sm mt-3 break-words">
                {myReview.comment}
              </p>
            )}
          </div>
        ) : (
          // ---------------------------------------------
          // CREATE / EDIT REVIEW FORM
          // ---------------------------------------------
          <form
            onSubmit={handleSubmit}
            className="border rounded-xl p-5 mb-8 bg-gray-50"
          >
            <div className="text-sm text-gray-500 mb-2">
              {myReview
                ? t("modals.review.yourReview")
                : t("modals.review.yourRating")}
            </div>

            <StarRating
              value={rating}
              onChange={setRating}
              size={28}
            />

            <Textarea
              className="mt-4"
              placeholder={t(
                "modals.review.commentPlaceholder"
              )}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />

            <div className="flex justify-end gap-3 mt-3">
              {myReview && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsEditing(false);

                    // O'zining eski review qiymatlarini qaytaramiz
                    setRating(myReview.rating);
                    setComment(myReview.comment);
                  }}
                >
                  Отмена
                </Button>
              )}

              <Button
                type="submit"
                loading={submitting}
              >
                <Icon
                  icon="mdi:send"
                  width={16}
                />

                {myReview
                  ? t("modals.review.update")
                  : t("modals.review.submit")}
              </Button>
            </div>
          </form>
        )
      ) : (
        // ---------------------------------------------
        // USER LOGIN QILMAGAN
        // ---------------------------------------------
        <div className="border rounded-xl p-5 mb-8 bg-gray-50 text-center text-gray-500 text-sm">
          {t("modals.review.loginToReview")}
        </div>
      )}

      {/* Empty reviews */}
      {!loading && reviews.length === 0 && (
        <p className="text-gray-400 text-sm">
          {t("modals.review.noReviews")}
        </p>
      )}

      {/* All reviews */}
      <div className="space-y-5">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="flex gap-3 border-b pb-5"
          >
            {/* Avatar */}
            {review.user_avatar ? (
              <img
                src={review.user_avatar}
                alt={review.user_name}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-gray-500 font-medium">
                {review.user_name?.[0]?.toUpperCase() || "?"}
              </div>
            )}

            {/* Review content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-gray-900">
                  {review.user_name}
                </span>

                <StarRating
                  value={review.rating}
                  readOnly
                  size={14}
                />

                <span className="text-xs text-gray-400">
                  {new Date(
                    review.created_at
                  ).toLocaleDateString("ru-RU")}
                </span>
              </div>

              {review.comment && (
                <p className="text-gray-600 text-sm mt-1 break-words">
                  {review.comment}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProductReviews;

