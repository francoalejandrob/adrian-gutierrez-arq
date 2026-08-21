"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import InstagramIcon from "@/components/icons/instagram-icon";
import { studio } from "@/lib/content";
import type { InstagramPost } from "@/lib/instagram";
import { useT } from "@/lib/i18n";
import { EASE_OUT } from "@/lib/motion";

const HANDLE = studio.instagram;
const PROFILE_URL = `https://instagram.com/${HANDLE}`;

type FeedItem = {
  id: string;
  permalink: string;
  kind: "image" | "video";
  src: string;
  caption?: string;
};

// Shown until IG_ACCESS_TOKEN is configured (see README) — real photos from
// the studio's Instagram instead of unrelated stock images.
const FALLBACK_ITEMS: FeedItem[] = [
  { id: "ig-1", permalink: PROFILE_URL, kind: "video", src: "/instagram/1.mp4" },
  { id: "ig-2", permalink: PROFILE_URL, kind: "image", src: "/instagram/2.jpg" },
  { id: "ig-3", permalink: PROFILE_URL, kind: "image", src: "/instagram/3.jpg" },
  { id: "ig-4", permalink: PROFILE_URL, kind: "image", src: "/instagram/4.jpg" },
  { id: "ig-5", permalink: PROFILE_URL, kind: "image", src: "/instagram/5.jpg" },
  { id: "ig-6", permalink: PROFILE_URL, kind: "image", src: "/instagram/6.jpg" },
  { id: "ig-7", permalink: PROFILE_URL, kind: "image", src: "/instagram/7.jpg" },
  { id: "ig-8", permalink: PROFILE_URL, kind: "image", src: "/instagram/8.jpg" },
];

export default function InstagramFeed({ posts }: { posts: InstagramPost[] }) {
  const t = useT();
  const items: FeedItem[] =
    posts.length > 0
      ? posts.map((post) => ({
          id: post.id,
          permalink: post.permalink,
          kind: "image",
          src: post.mediaUrl,
          caption: post.caption,
        }))
      : FALLBACK_ITEMS;

  return (
    <section className="border-t border-hueso/10 bg-carbon py-14 md:py-20">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10">
        <div className="mb-10 flex items-center justify-between">
          <a
            href={PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="press flex items-center gap-3 text-hueso transition-colors duration-200 hover:text-naranja"
          >
            <InstagramIcon className="h-7 w-7" />
            <span className="font-display text-xl">@{HANDLE}</span>
          </a>
          <a
            href={PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="press hidden font-mono text-xs uppercase tracking-[0.15em] text-hueso/60 transition-colors duration-200 hover:text-naranja sm:inline"
          >
            {t.instagram.follow}
          </a>
        </div>

        <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
          {items.map((item, i) => (
            <motion.a
              key={item.id}
              href={item.permalink}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.5, delay: i * 0.04, ease: EASE_OUT }}
              className="group relative aspect-square overflow-hidden"
            >
              {item.kind === "video" ? (
                <video
                  src={item.src}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="h-full w-full scale-105 object-cover transition-transform duration-500 ease-out-strong group-hover:scale-110"
                />
              ) : (
                <Image
                  src={item.src}
                  alt={item.caption?.slice(0, 200) || "Publicación del estudio en Instagram"}
                  fill
                  sizes="(min-width: 640px) 25vw, 50vw"
                  className="object-cover transition-transform duration-500 ease-out-strong group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-carbon/0 transition-colors duration-300 group-hover:bg-carbon/20" />
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
