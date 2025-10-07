import * as React from "react";
import { addPropertyControls, ControlType } from "framer";

type Entry = {
  id: string;
  title?: string;
  link?: string;
  thumbnail?: string;
  published?: string;
  updated?: string;
};

type Props = {
  domain: string;
  channelId?: string;
  handle?: string;
  max: number;
  columns: number;
  gap: number;
  thumbnailHeight: number;
  titleColor: string;
  metaColor: string;
  titleFontSize: number;
  titleFontWeight: number;
  metaFontSize: number;
  showMeta: boolean;
  enableAutoplay: boolean;
  autoplayWidth: number;
  autoplayHeight: number;
};

export default function YouTubeGrid(props: Partial<Props>) {
  const {
    domain = "myyoutubefeed-d9ls0uspl-danieleloma-wonderadsios-projects.vercel.app",
    channelId = "UCdxk_T-82-s_J4ChPpw2sdg",
    handle = "",
    max = 12,
    columns = 3,
    gap = 20,
    thumbnailHeight = 180,
    titleColor = "#0f0f23",
    metaColor = "#606060",
    titleFontSize = 14,
    titleFontWeight = 500,
    metaFontSize = 12,
    showMeta = true,
    enableAutoplay = false,
    autoplayWidth = 560,
    autoplayHeight = 315,
  } = props;

  const [entries, setEntries] = React.useState<Entry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = React.useState<string | null>(null);

  React.useEffect(() => {
    const qs = new URLSearchParams();
    if (handle) {
      qs.set("handle", handle);
    } else {
      qs.set("channelId", channelId);
    }
    qs.set("format", "json");
    qs.set("max", String(max));

    const url = `https://${domain}/api/youtube-rss?${qs.toString()}`;

    let active = true;
    setLoading(true);
    setError(null);

    fetch(url, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) {
          const text = await r.text().catch(() => "");
          throw new Error(`HTTP ${r.status} ${r.statusText}: ${text.slice(0, 200)}`);
        }
        return r.json();
      })
      .then((d) => {
        if (!active) return;
        setEntries(Array.isArray(d?.entries) ? d.entries : []);
      })
      .catch((e) => active && setError(e.message || "Failed to load"))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [domain, channelId, handle, max]);

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${Math.max(1, columns)}, minmax(280px, 1fr))`,
    gap,
  };

  const handleVideoClick = (videoId: string) => {
    if (enableAutoplay) {
      setPlayingVideo(videoId);
    } else {
      window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener,noreferrer');
    }
  };

  if (error) {
    return React.createElement("div", {
      style: { ...gridStyle, color: "#ef4444", fontFamily: "Inter, system-ui, sans-serif" }
    }, `Error: ${error}`);
  }

  if (loading) {
    return React.createElement("div", { style: gridStyle },
      Array.from({ length: Math.min(max, columns * 2) }).map((_, i) =>
        React.createElement("div", { key: i, style: { display: "flex", flexDirection: "column" } },
          React.createElement("div", { style: { width: "100%", height: thumbnailHeight, background: "#f3f4f6", borderRadius: 12 } }),
          React.createElement("div", { style: { padding: "8px 0 0 0" } },
            React.createElement("div", { style: { width: "80%", height: 14, background: "#e5e7eb", marginBottom: 8, borderRadius: 4 } }),
            React.createElement("div", { style: { width: "60%", height: 10, background: "#f3f4f6", borderRadius: 4 } })
          )
        )
      )
    );
  }

  return React.createElement(React.Fragment, null,
    playingVideo && React.createElement("div", {
      style: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      },
      onClick: () => setPlayingVideo(null)
    },
      React.createElement("div", {
        style: {
          background: "#000",
          borderRadius: 8,
          padding: 20,
          maxWidth: "90vw",
          maxHeight: "90vh",
          position: "relative",
        },
        onClick: (e: any) => e.stopPropagation()
      },
        React.createElement("button", {
          onClick: () => setPlayingVideo(null),
          style: {
            position: "absolute",
            top: 10,
            right: 10,
            background: "rgba(0, 0, 0, 0.7)",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: 30,
            height: 30,
            cursor: "pointer",
            fontSize: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }
        }, "×"),
        React.createElement("iframe", {
          width: autoplayWidth,
          height: autoplayHeight,
          src: `https://www.youtube.com/embed/${playingVideo}?autoplay=1&rel=0`,
          title: "YouTube video player",
          frameBorder: 0,
          allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
          allowFullScreen: true
        })
      )
    ),
    React.createElement("div", { style: gridStyle },
      entries.map((e, i) => {
        const videoId = e.id;
        return React.createElement("div", {
          key: i,
          onClick: () => handleVideoClick(videoId),
          style: {
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            transition: "transform 0.2s",
          },
          onMouseEnter: (e: any) => {
            e.currentTarget.style.transform = "translateY(-2px)";
          },
          onMouseLeave: (e: any) => {
            e.currentTarget.style.transform = "translateY(0)";
          }
        },
          React.createElement("div", { style: { position: "relative", borderRadius: 12, overflow: "hidden" } },
            e.thumbnail && React.createElement(React.Fragment, null,
              React.createElement("img", {
                src: e.thumbnail,
                alt: "",
                style: {
                  width: "100%",
                  height: thumbnailHeight,
                  objectFit: "cover",
                  display: "block",
                }
              }),
              enableAutoplay && React.createElement("div", {
                style: {
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  background: "rgba(0, 0, 0, 0.7)",
                  borderRadius: "50%",
                  width: 60,
                  height: 60,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }
              },
                React.createElement("div", {
                  style: {
                    width: 0,
                    height: 0,
                    borderLeft: "20px solid white",
                    borderTop: "12px solid transparent",
                    borderBottom: "12px solid transparent",
                    marginLeft: 4,
                  }
                })
              )
            )
          ),
          React.createElement("div", { style: { padding: "8px 0 0 0" } },
            React.createElement("div", {
              style: {
                fontWeight: titleFontWeight,
                marginBottom: showMeta ? 4 : 0,
                fontSize: titleFontSize,
                lineHeight: 1.4,
                color: titleColor,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
            }, e.title),
            showMeta && React.createElement("div", {
              style: { 
                color: metaColor, 
                fontSize: metaFontSize, 
                margin: 0,
                lineHeight: 1.4,
              }
            }, new Date(e.published || e.updated || Date.now()).toLocaleString())
          )
        );
      })
    )
  );
}

addPropertyControls(YouTubeGrid, {
  domain: { type: ControlType.String, title: "Domain", defaultValue: "myyoutubefeed-d9ls0uspl-danieleloma-wonderadsios-projects.vercel.app" },
  channelId: { type: ControlType.String, title: "Channel ID", defaultValue: "UCdxk_T-82-s_J4ChPpw2sdg" },
  handle: { type: ControlType.String, title: "Handle (@...)", defaultValue: "" },
  max: { type: ControlType.Number, title: "Max Videos", min: 1, max: 50, defaultValue: 12 },
  columns: { type: ControlType.Number, title: "Columns", min: 1, max: 6, defaultValue: 3 },
  gap: { type: ControlType.Number, title: "Gap (px)", min: 0, max: 48, defaultValue: 20 },
  thumbnailHeight: { type: ControlType.Number, title: "Thumb Height", min: 120, max: 400, defaultValue: 180 },
  titleColor: { type: ControlType.Color, title: "Title Color", defaultValue: "#0f0f23" },
  metaColor: { type: ControlType.Color, title: "Meta Color", defaultValue: "#606060" },
  titleFontSize: { type: ControlType.Number, title: "Title Font Size", min: 10, max: 24, defaultValue: 14 },
  titleFontWeight: { type: ControlType.Number, title: "Title Font Weight", min: 300, max: 700, defaultValue: 500 },
  metaFontSize: { type: ControlType.Number, title: "Meta Font Size", min: 8, max: 18, defaultValue: 12 },
  showMeta: { type: ControlType.Boolean, title: "Show Meta", defaultValue: true },
  enableAutoplay: { type: ControlType.Boolean, title: "Enable Autoplay", defaultValue: false },
  autoplayWidth: { type: ControlType.Number, title: "Video Width", min: 320, max: 1280, defaultValue: 560 },
  autoplayHeight: { type: ControlType.Number, title: "Video Height", min: 180, max: 720, defaultValue: 315 },
});
