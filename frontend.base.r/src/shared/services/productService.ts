import axiosInstance from "@shared/services/axiosInstance";

export interface ProductReview {
  id: number;
  product: number;
  user: number;
  user_name: string;
  user_avatar: string | null;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewSummary {
  average: number;
  count: number;
}

export const fetchProductReviews = async (
  productId: number
): Promise<ProductReview[]> => {
  const res = await axiosInstance.get("/products/reviews/", {
    params: { product: productId },
  });
  return res.data?.results ?? res.data;
};

export const fetchReviewSummary = async (
  productId: number
): Promise<ReviewSummary> => {
  const res = await axiosInstance.get("/products/reviews/summary/", {
    params: { product: productId },
  });
  return res.data;
};

export const submitProductReview = async (
  productId: number,
  rating: number,
  comment: string
): Promise<ProductReview> => {
  const res = await axiosInstance.post("/products/reviews/", {
    product: productId,
    rating,
    comment,
  });
  return res.data;
};
