import Image from "next/image";
import Link from "next/link";
import { isExternalBannerLink } from "@/lib/admin/banner-urls";
import type { PublicBanner } from "@/lib/supabase/banners-server";

interface HomeBannersProps {
  banners: PublicBanner[];
}

export default function HomeBanners({ banners }: HomeBannersProps) {
  if (!banners.length) return null;

  return (
    <section className="px-4 py-4 max-w-7xl mx-auto">
      <div className="flex gap-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory pb-1">
        {banners.map((banner) => {
          const content = (
            <div className="relative w-[min(100%,420px)] shrink-0 snap-start aspect-[21/9] rounded-2xl overflow-hidden bg-[#F5F3F0] dark:bg-[#2D2A26]">
              <Image
                src={banner.image_url}
                alt={banner.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 420px"
                unoptimized={banner.image_url.startsWith("http")}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <p className="font-display font-bold text-lg leading-tight">{banner.title}</p>
                {banner.subtitle && (
                  <p className="text-sm text-white/80 mt-1 line-clamp-2">{banner.subtitle}</p>
                )}
              </div>
            </div>
          );

          if (banner.link_url) {
            const external = isExternalBannerLink(banner.link_url);
            return (
              <Link
                key={banner.id}
                href={banner.link_url}
                className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
                {...(external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {content}
              </Link>
            );
          }

          return <div key={banner.id}>{content}</div>;
        })}
      </div>
    </section>
  );
}
