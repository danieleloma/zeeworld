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
  channelId: string;
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
};

export default function YouTubeGrid(props: Props) {
  const {
    channelId = "UCdxk_T-82-s_J4ChPpw2sdg",
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
  } = props;

  const [entries, setEntries] = React.useState<Entry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = React.useState<string | null>(null);

  const domain = "myyoutubefeed-mdglr8n1j-danieleloma-wonderadsios-projects.vercel.app";

  React.useEffect(() => {
    const qs = new URLSearchParams();
    qs.set("channelId", channelId);
    qs.set("format", "json");
    qs.set("max", String(max));

    const url = `https://${domain}/api/youtube-rss?${qs.toString()}`;

    let active = true;
    setLoading(true);
    setError(null);

    fetch(url, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) {
          throw new Error(`HTTP ${r.status}`);
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
  }, [channelId, max]);

  const handleVideoClick = (videoId: string) => {
    if (enableAutoplay) {
      setPlayingVideo(videoId);
    } else {
      window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
    }
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${Math.max(1, columns)}, 1fr)`,
    gap: `${gap}px`,
    width: "100%",
  };

  if (error) {
    return (
      <div style={{ ...gridStyle, color: "#ef4444", padding: "20px" }}>
        Error: {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div style={gridStyle}>
        {Array.from({ length: Math.min(max, columns * 2) }).map((_, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                width: "100%",
                height: `${thumbnailHeight}px`,
                background: "#f3f4f6",
                borderRadius: "12px",
              }}
            />
            <div style={{ padding: "8px 0 0 0" }}>
              <div
                style={{
                  width: "80%",
                  height: "14px",
                  background: "#e5e7eb",
                  marginBottom: "8px",
                  borderRadius: "4px",
                }}
              />
              <div
                style={{
                  width: "60%",
                  height: "10px",
                  background: "#f3f4f6",
                  borderRadius: "4px",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {playingVideo && (
        <div
          style={{
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
          }}
          onClick={() => setPlayingVideo(null)}
        >
          <div
            style={{
              background: "#000",
              borderRadius: "8px",
              padding: "20px",
              maxWidth: "90vw",
              maxHeight: "90vh",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPlayingVideo(null)}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "rgba(0, 0, 0, 0.7)",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "30px",
                height: "30px",
                cursor: "pointer",
                fontSize: "18px",
              }}
            >
              ×
            </button>
            <iframe
              width="560"
              height="315"
              src={`https://www.youtube.com/embed/${playingVideo}?autoplay=1&rel=0`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      <div style={gridStyle}>
        {entries.map((entry, i) => {
          const videoId = entry.id;
          return (
            <div
              key={i}
              onClick={() => handleVideoClick(videoId)}
              style={{
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                style={{
                  position: "relative",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >
                {entry.thumbnail && (
                  <>
                    <img
                      src={entry.thumbnail}
                      alt=""
                      style={{
                        width: "100%",
                        height: `${thumbnailHeight}px`,
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    {enableAutoplay && (
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          background: "rgba(0, 0, 0, 0.7)",
                          borderRadius: "50%",
                          width: "60px",
                          height: "60px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            width: 0,
                            height: 0,
                            borderLeft: "20px solid white",
                            borderTop: "12px solid transparent",
                            borderBottom: "12px solid transparent",
                            marginLeft: "4px",
                          }}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              <div style={{ padding: "8px 0 0 0" }}>
                <div
                  style={{
                    fontWeight: titleFontWeight,
                    marginBottom: showMeta ? "4px" : "0",
                    fontSize: `${titleFontSize}px`,
                    lineHeight: 1.4,
                    color: titleColor,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {entry.title}
                </div>
                {showMeta && (
                  <div
                    style={{
                      color: metaColor,
                      fontSize: `${metaFontSize}px`,
                      margin: 0,
                      lineHeight: 1.4,
                    }}
                  >
                    {new Date(entry.published || entry.updated || Date.now()).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

addPropertyControls(YouTubeGrid, {
  channelId: {
    type: ControlType.String,
    title: "Channel ID",
    defaultValue: "UCdxk_T-82-s_J4ChPpw2sdg",
  },
  max: {
    type: ControlType.Number,
    title: "Max Videos",
    min: 1,
    max: 50,
    defaultValue: 12,
  },
  columns: {
    type: ControlType.Number,
    title: "Columns",
    min: 1,
    max: 6,
    defaultValue: 3,
  },
  gap: {
    type: ControlType.Number,
    title: "Gap (px)",
    min: 0,
    max: 48,
    defaultValue: 20,
  },
  thumbnailHeight: {
    type: ControlType.Number,
    title: "Thumb Height",
    min: 120,
    max: 400,
    defaultValue: 180,
  },
  titleColor: {
    type: ControlType.Color,
    title: "Title Color",
    defaultValue: "#0f0f23",
  },
  metaColor: {
    type: ControlType.Color,
    title: "Meta Color",
    defaultValue: "#606060",
  },
  titleFontSize: {
    type: ControlType.Number,
    title: "Title Font Size",
    min: 10,
    max: 24,
    defaultValue: 14,
  },
  titleFontWeight: {
    type: ControlType.Number,
    title: "Title Font Weight",
    min: 300,
    max: 700,
    defaultValue: 500,
  },
  metaFontSize: {
    type: ControlType.Number,
    title: "Meta Font Size",
    min: 8,
    max: 18,
    defaultValue: 12,
  },
  showMeta: {
    type: ControlType.Boolean,
    title: "Show Meta",
    defaultValue: true,
  },
  enableAutoplay: {
    type: ControlType.Boolean,
    title: "Enable Autoplay",
    defaultValue: false,
  },
});
