"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Star, Search, Trash2 } from "lucide-react";
import AdminLoader from "@/components/admin/AdminLoader";
import AdminConfirmDelete from "@/components/admin/AdminConfirmDelete";
import AdminEmptyState from "@/components/admin/AdminEmptyState";

interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  users: { full_name: string | null; email: string | null } | null;
  restaurants: { name: string | null } | null;
}

const ReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [restaurantFilter, setRestaurantFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/reviews");
    const data = await response.json();
    if (response.ok) setReviews(data.reviews || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await fetch(`/api/admin/reviews?id=${deleteId}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteId(null);
    loadReviews();
  };

  const restaurantNames = Array.from(
    new Set(reviews.map((r) => r.restaurants?.name).filter((n): n is string => Boolean(n)))
  );

  const filteredReviews = reviews.filter((r) => {
    const userName = r.users?.full_name || r.users?.email || "";
    const matchesSearch =
      userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.comment || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRestaurant = !restaurantFilter || r.restaurants?.name === restaurantFilter;
    const matchesRating = !ratingFilter || r.rating === parseInt(ratingFilter, 10);
    return matchesSearch && matchesRestaurant && matchesRating;
  });

  if (loading) return <AdminLoader />;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Отзывы</h1>
          <p className="text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">{reviews.length} отзывов в базе</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2D2A26]/40" />
          <input
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-[#2D2A26] border border-[#F5F3F0] dark:border-[#3D3A36] focus:border-primary outline-none"
          />
        </div>
        <select
          value={restaurantFilter}
          onChange={(e) => setRestaurantFilter(e.target.value)}
          className="px-4 py-3 rounded-xl bg-white dark:bg-[#2D2A26] border border-[#F5F3F0] outline-none"
        >
          <option value="">Все рестораны</option>
          {restaurantNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="px-4 py-3 rounded-xl bg-white dark:bg-[#2D2A26] border border-[#F5F3F0] outline-none"
        >
          <option value="">Любой рейтинг</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={String(n)}>
              {n} звёзд
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {filteredReviews.map((review) => {
          const userName = review.users?.full_name || review.users?.email || "Пользователь";
          const date = new Date(review.created_at).toLocaleDateString("ru-RU");
          return (
            <div
              key={review.id}
              className="bg-white dark:bg-[#2D2A26] rounded-2xl border border-[#F5F3F0] dark:border-[#3D3A36] p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-primary">
                    {userName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">{userName}</p>
                    <p className="text-sm text-[#2D2A26]/60">
                      {review.restaurants?.name || "—"} • {date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${star <= review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => setDeleteId(review.id)}
                    className="p-2 text-red-400 hover:text-red-600 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-[#2D2A26]/80 dark:text-[#E8E6E3]/80">
                {review.comment || "Без комментария"}
              </p>
            </div>
          );
        })}
        {filteredReviews.length === 0 && <AdminEmptyState title="Отзывов пока нет" />}
      </div>

      <AdminConfirmDelete
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message="Отзыв будет удалён безвозвратно."
      />
    </div>
  );
};

export default ReviewsPage;
