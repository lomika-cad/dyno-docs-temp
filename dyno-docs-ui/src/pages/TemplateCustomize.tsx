import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import HeightRoundedIcon from "@mui/icons-material/HeightRounded";
import JSON5 from "json5";
import { updateDesign } from "../services/template-api";
import { getTenantInfo } from "../services/auth-api";
import { showError, showSuccess } from "../components/Toast";
import "../styles/agencyData.css";
import "../styles/templateCustomize.css";

type TemplateCardModel = {
  id: string;
  templateId: string;
  name: string;
  description: string;
  thumbnail: string | null;
  isPaid: boolean;
  priceLabel: string;
  priceValue: number | null;
  designMarkup: string;
};

type TemplateDesign = {
  version?: string;
  pageSize?: string;
  background?: string;
  pages?: TemplateDesignPage[];
};

type TemplateDesignPage = {
  pageNumber?: number;
  elements?: TemplateDesignElement[];
};

type TemplateDesignElement =
  | TemplateTextElement
  | TemplateShapeElement
  | TemplateImageElement
  | TemplatePillElement;

type TemplateBaseElement = {
  id?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  opacity?: number;
};

type TemplateTextElement = TemplateBaseElement & {
  type?: "text";
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number | string;
  color?: string;
  letterSpacing?: number;
  lineHeight?: number;
};

type TemplateShapeElement = TemplateBaseElement & {
  type?: "shape";
  shape?: "rectangle" | "line" | "polygon" | "circle";
  fill?: string;
  stroke?: string;
  points?: { x: number; y: number }[];
  borderRadius?: number;
  shadow?: string;
  blur?: number;
};

type TemplateImageElement = TemplateBaseElement & {
  type?: "image";
  src?: string;
  fallback?: string;
  borderRadius?: number;
};

type TemplatePillElement = TemplateBaseElement & {
  type?: "pill";
  label?: string;
  value?: string;
  icon?: string;
  colors?: { bg?: string; text?: string };
};

type TenantProfile = {
  agencyLogo?: string | null;
  agencyName?: string | null;
  contactNo?: string | null;
  agencyAddress?: string | null;
};

type PlaceholderMap = Record<string, string>;

const DEFAULT_PLACEHOLDERS: PlaceholderMap = {
  "{{agency_name}}": "Tour Travels LK",
  "{{agency_logo_url}}": "https://static.vecteezy.com/system/resources/previews/000/511/437/original/travel-tourism-logo-isolated-on-white-background-vector.jpg",
  "{{hero_image_url}}": "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/39598465939125.5b055c778c346.jpg",
  "{{footer_texture_url}}": "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/39598465939125.5b055c778c346.jpg",
  "{{contact_phone}}": "+94 77 123 4567",
  "{{contact_website}}": "www.tourtravels.lk",
  "{{contact_address}}": "45 Galle Road, Colombo 03",
  "{{tourism_board_logo}}": "https://www.sltda.gov.lk/images/sltda_logo.png",
  "{{cover_image_url}}": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeImageTokenValue = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }
  if (trimmed.startsWith("http") || trimmed.startsWith("data:")) {
    return trimmed;
  }
  return `data:image/png;base64,${trimmed}`;
};

const buildTenantPlaceholders = (tenant?: TenantProfile | null): PlaceholderMap => ({
  ...DEFAULT_PLACEHOLDERS,
  "{{agency_logo_url}}": tenant?.agencyLogo
    ? normalizeImageTokenValue(tenant.agencyLogo)
    : DEFAULT_PLACEHOLDERS["{{agency_logo_url}}"],
  "{{agency_name}}": tenant?.agencyName?.trim() || DEFAULT_PLACEHOLDERS["{{agency_name}}"],
  "{{contact_phone}}": tenant?.contactNo?.trim() || DEFAULT_PLACEHOLDERS["{{contact_phone}}"],
  "{{contact_address}}": tenant?.agencyAddress?.trim() || DEFAULT_PLACEHOLDERS["{{contact_address}}"],
});

const resolvePlaceholders = (value: string, placeholders: PlaceholderMap) => {
  let result = value;
  Object.entries(placeholders).forEach(([placeholder, sample]) => {
    result = result.replace(new RegExp(escapeRegExp(placeholder), "g"), sample);
  });
  return result;
};

const resolveImageSource = (
  src: string | undefined,
  fallback: string | undefined,
  placeholders: PlaceholderMap,
) => {
  if (!src) {
    return fallback ? resolvePlaceholders(fallback, placeholders) : placeholders["{{cover_image_url}}"];
  }
  if (src.startsWith("http") || src.startsWith("data:")) {
    return src;
  }
  return (
    placeholders[src] ??
    (fallback ? resolvePlaceholders(fallback, placeholders) : placeholders["{{cover_image_url}}"])
  );
};

const tryStandardJsonParse = (payload: string): TemplateDesign | null => {
  try {
    const parsed = JSON.parse(payload);
    if (!parsed || !Array.isArray(parsed.pages)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const repairBareNewlines = (payload: string) => {
  let inString = false;
  let escapeNext = false;
  let quoteChar: string | null = null;
  let repaired = "";

  for (let index = 0; index < payload.length; index += 1) {
    const char = payload[index];

    if (inString) {
      if (escapeNext) {
        escapeNext = false;
        repaired += char;
        continue;
      }

      if (char === "\\") {
        escapeNext = true;
        repaired += char;
        continue;
      }

      if (char === quoteChar) {
        inString = false;
        quoteChar = null;
        repaired += char;
        continue;
      }

      if (char === "\n") {
        repaired += "\\n";
        continue;
      }

      if (char === "\r") {
        repaired += "\\r";
        continue;
      }

      repaired += char;
      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      quoteChar = char;
      repaired += char;
      continue;
    }

    repaired += char;
  }

  return repaired;
};

const parseDesign = (markup: string): TemplateDesign | null => {
  const parsed = tryStandardJsonParse(markup);
  if (parsed) {
    return parsed;
  }

  const repairedMarkup = repairBareNewlines(markup);
  if (repairedMarkup !== markup) {
    const repairedParsed = tryStandardJsonParse(repairedMarkup);
    if (repairedParsed) {
      return repairedParsed;
    }
  }

  try {
    const json5Parsed = JSON5.parse(markup);
    if (!json5Parsed || !Array.isArray(json5Parsed.pages)) {
      return null;
    }
    return json5Parsed;
  } catch {
    return null;
  }
};

const DEFAULT_DESIGN = {
  version: "1.0",
  pageSize: "A4",
  background: "#ffffff",
  pages: [{ pageNumber: 1, elements: [] }],
} as TemplateDesign;

const BASE_WIDTH = 595;
const BASE_HEIGHT = 842;

export default function TemplateCustomize() {
  const location = useLocation();
  const navigate = useNavigate();
  const template = (location.state as { template?: TemplateCardModel } | null)?.template;

  const [design, setDesign] = useState<TemplateDesign | null>(null);
  const [selectedElementIndex, setSelectedElementIndex] = useState<number | null>(null);
  const [placeholders, setPlaceholders] = useState<PlaceholderMap>(DEFAULT_PLACEHOLDERS);
  const [isSaving, setIsSaving] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(720);

  const canvasWrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasScrollRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    index: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const scale = Math.min(1, canvasWidth / BASE_WIDTH);
  const canvasHeight = BASE_HEIGHT * scale;

  const page = design?.pages?.[0];
  const elements = page?.elements ?? [];
  const selectedElement =
    selectedElementIndex !== null && selectedElementIndex >= 0
      ? elements[selectedElementIndex]
      : null;

  useEffect(() => {
    if (!template?.designMarkup) {
      setDesign(DEFAULT_DESIGN);
      return;
    }

    const parsed = parseDesign(template.designMarkup);
    setDesign(parsed ?? DEFAULT_DESIGN);
  }, [template?.designMarkup]);

  useEffect(() => {
    if (!canvasWrapperRef.current) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setCanvasWidth(entry.contentRect.width);
      }
    });

    observer.observe(canvasWrapperRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const tenantId = sessionStorage.getItem("dd_tenant_id");
    if (!tenantId) {
      return;
    }

    getTenantInfo(tenantId)
      .then((info) => setPlaceholders(buildTenantPlaceholders(info as TenantProfile)))
      .catch(() => setPlaceholders(DEFAULT_PLACEHOLDERS));
  }, []);

  useEffect(() => {
    const container = canvasScrollRef.current;
    if (!container) {
      return;
    }

    const centerCanvas = () => {
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      if (maxScrollLeft <= 0) {
        return;
      }
      container.scrollLeft = maxScrollLeft / 2;
    };

    const frame = window.requestAnimationFrame(centerCanvas);
    return () => window.cancelAnimationFrame(frame);
  }, [canvasWidth, design]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!dragRef.current) {
        return;
      }

      const { index, startX, startY, originX, originY } = dragRef.current;
      const dx = (event.clientX - startX) / scale;
      const dy = (event.clientY - startY) / scale;

      setDesign((prev) => {
        if (!prev?.pages?.[0]?.elements) {
          return prev;
        }

        const pages = [...prev.pages];
        const pageToUpdate = { ...pages[0] };
        const updatedElements = [...(pageToUpdate.elements ?? [])];
        const current = updatedElements[index];
        if (!current) {
          return prev;
        }
        updatedElements[index] = {
          ...current,
          x: Math.max(0, originX + dx),
          y: Math.max(0, originY + dy),
        };
        pageToUpdate.elements = updatedElements;
        pages[0] = pageToUpdate;
        return { ...prev, pages };
      });
    };

    const handleMouseUp = () => {
      dragRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [scale]);

  const elementSummary = useMemo(() => {
    return elements.map((element) => {
      if (!element) {
        return "Untitled";
      }
      if (element.type === "text") {
        const text = (element as TemplateTextElement).content ?? "Text";
        return `Text · ${resolvePlaceholders(text, placeholders).slice(0, 24)}`;
      }
      if (element.type === "image") {
        return "Image";
      }
      if (element.type === "shape") {
        const shape = (element as TemplateShapeElement).shape ?? "shape";
        return `Shape · ${shape}`;
      }
      if (element.type === "pill") {
        return "Pill";
      }
      return "Element";
    });
  }, [elements, placeholders]);

  const updateElementAtIndex = (index: number, updater: (current: TemplateDesignElement) => TemplateDesignElement) => {
    setDesign((prev) => {
      if (!prev?.pages?.[0]?.elements) {
        return prev;
      }
      const pages = [...prev.pages];
      const pageToUpdate = { ...pages[0] };
      const updatedElements = [...(pageToUpdate.elements ?? [])];
      const current = updatedElements[index];
      if (!current) {
        return prev;
      }
      updatedElements[index] = updater(current);
      pageToUpdate.elements = updatedElements;
      pages[0] = pageToUpdate;
      return { ...prev, pages };
    });
  };

  const handleElementMouseDown = (event: React.MouseEvent<HTMLDivElement>, index: number) => {
    event.stopPropagation();
    const element = elements[index];
    if (!element) {
      return;
    }
    setSelectedElementIndex(index);
    dragRef.current = {
      index,
      startX: event.clientX,
      startY: event.clientY,
      originX: element.x ?? 0,
      originY: element.y ?? 0,
    };
  };

  const handleCanvasClick = () => {
    setSelectedElementIndex(null);
  };

  const handleTextContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (selectedElementIndex === null) {
      return;
    }
    const newValue = event.target.value;
    updateElementAtIndex(selectedElementIndex, (current) => {
      if (current.type !== "text") {
        return current;
      }
      return {
        ...current,
        content: newValue,
      } as TemplateTextElement;
    });
  };

  const handleImageSizeChange = (
    dimension: "width" | "height",
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (selectedElementIndex === null) {
      return;
    }

    const raw = Number(event.target.value);
    if (Number.isNaN(raw) || raw <= 0) {
      return;
    }

    updateElementAtIndex(selectedElementIndex, (current) => {
      if (current.type !== "image") {
        return current;
      }
      const updated: TemplateImageElement = { ...current } as TemplateImageElement;
      updated[dimension] = raw;
      return updated;
    });
  };

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedElementIndex === null) {
      return;
    }
    updateElementAtIndex(selectedElementIndex, (current) => ({
      ...current,
      color: event.target.value,
    }));
  };

  const handleSave = async () => {
    if (!template || !design) {
      return;
    }

    const token = sessionStorage.getItem("dd_token");
    if (!token) {
      showError("Please sign in to save template updates.");
      return;
    }

    setIsSaving(true);
    try {
      const normalizedDesign: TemplateDesign = {
        ...design,
        pageSize: "A4",
      };
      const payload = {
        templateId: template.templateId,
        userId: sessionStorage.getItem("dd_user_id"),
        templateDesign: JSON.stringify(normalizedDesign),
      };
      const response = await updateDesign(payload, token);
      const message =
        (response as { message?: string; Message?: string })?.message ??
        (response as { message?: string; Message?: string })?.Message ??
        "Template design updated successfully.";
      showSuccess(message);
    } catch (error) {
      showError("Unable to update template design. Please try again.");
      console.error("updateDesign failed", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    navigate("/templates");
  };

  if (!template) {
    return (
      <div className="template-customize">
        <div className="template-customize-empty">
          <h2>Template not found</h2>
          <p>Open the template from My Templates to start customizing.</p>
          <button type="button" className="btn btn--orange" onClick={handleBack}>
            Back to templates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="template-customize">
      <header className="template-customize-header">
        <div className="template-customize-title">
          <button type="button" className="template-customize-back" onClick={handleBack}>
            <ArrowBackRoundedIcon fontSize="small" />
          </button>
          <div>
            <p>Template customization</p>
            <h1>{template.name}</h1>
          </div>
        </div>
        <div className="template-customize-actions">
          <div className="template-customize-badge">
            <HeightRoundedIcon fontSize="small" />
            A4 canvas (595×842)
          </div>
          <button
            type="button"
            className="btn btn--orange"
            onClick={handleSave}
            disabled={isSaving}
          >
            <SaveRoundedIcon fontSize="small" />
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </header>

      <main className="template-customize-content">
        <aside className="template-customize-panel template-customize-panel--left">
          <div className="template-customize-panel-card">
            <h3>Layers</h3>
            <div className="template-customize-layer-list">
              {elementSummary.length === 0 && <p className="template-customize-hint">No elements found.</p>}
              {elementSummary.map((summary, index) => (
                <button
                  key={`layer-${index}`}
                  type="button"
                  className={`template-customize-layer ${selectedElementIndex === index ? "active" : ""}`}
                  onClick={() => setSelectedElementIndex(index)}
                >
                  <span>{summary}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="template-customize-canvas">
          <div
            className="template-customize-canvas-scroll"
            onClick={handleCanvasClick}
            ref={canvasScrollRef}
          >
            <div className="template-customize-canvas-wrapper" ref={canvasWrapperRef}>
              <div
                className="template-customize-canvas-stage"
                style={{ width: BASE_WIDTH * scale, height: canvasHeight, background: design?.background ?? "#fff" }}
              >
                {elements.map((element, index) => {
                  const baseStyle: CSSProperties = {
                    left: (element.x ?? 0) * scale,
                    top: (element.y ?? 0) * scale,
                    width: element.width ? element.width * scale : undefined,
                    height: element.height ? element.height * scale : undefined,
                    position: "absolute",
                    opacity: typeof element.opacity === "number" ? element.opacity : undefined,
                  };

                  const isSelected = selectedElementIndex === index;
                  const elementClasses = `customize-element ${isSelected ? "customize-element--active" : ""}`;

                  if (element.type === "text") {
                    const textEl = element as TemplateTextElement;
                    return (
                      <div
                        key={element.id ?? `element-${index}`}
                        className={elementClasses}
                        style={{
                          ...baseStyle,
                          fontSize: (textEl.fontSize ?? 14) * scale,
                          fontFamily: textEl.fontFamily ?? "Poppins",
                          fontWeight: textEl.fontWeight ?? 500,
                          color: textEl.color ?? "#111827",
                          letterSpacing:
                            typeof textEl.letterSpacing === "number"
                              ? textEl.letterSpacing * scale
                              : textEl.letterSpacing,
                          lineHeight: textEl.lineHeight ?? 1.4,
                        }}
                        onMouseDown={(event) => handleElementMouseDown(event, index)}
                      >
                        {resolvePlaceholders(textEl.content ?? "", placeholders)}
                      </div>
                    );
                  }

                  if (element.type === "image") {
                    const imageEl = element as TemplateImageElement;
                    return (
                      <img
                        key={element.id ?? `element-${index}`}
                        className={elementClasses}
                        style={{
                          ...baseStyle,
                          borderRadius: (imageEl.borderRadius ?? 0) * scale,
                        }}
                        src={resolveImageSource(imageEl.src, imageEl.fallback, placeholders)}
                        alt={element.id ?? "Template image"}
                        onMouseDown={(event) => handleElementMouseDown(event, index)}
                      />
                    );
                  }

                  if (element.type === "pill") {
                    const pillEl = element as TemplatePillElement;
                    return (
                      <div
                        key={element.id ?? `element-${index}`}
                        className={`${elementClasses} design-pill`}
                        style={{
                          ...baseStyle,
                          background: pillEl.colors?.bg ?? "#ffffff",
                          color: pillEl.colors?.text ?? "#111827",
                          borderColor: `${(pillEl.colors?.text ?? "#111827")}30`,
                        }}
                        onMouseDown={(event) => handleElementMouseDown(event, index)}
                      >
                        <span className="design-pill-label">{pillEl.label}</span>
                        <span className="design-pill-value">
                          {resolvePlaceholders(pillEl.value ?? "", placeholders)}
                        </span>
                      </div>
                    );
                  }

                  if (element.type === "shape") {
                    const shapeEl = element as TemplateShapeElement;
                    if (shapeEl.shape === "line") {
                      return (
                        <div
                          key={element.id ?? `element-${index}`}
                          className={`${elementClasses} design-shape design-shape--line`}
                          style={{
                            ...baseStyle,
                            height: Math.max(1, (shapeEl.height ?? 1) * scale),
                            background: shapeEl.stroke ?? shapeEl.fill ?? "#e5e7eb",
                          }}
                          onMouseDown={(event) => handleElementMouseDown(event, index)}
                        />
                      );
                    }

                    if (shapeEl.shape === "circle") {
                      const diameter = (shapeEl.width ?? shapeEl.height ?? 0) * scale;
                      return (
                        <div
                          key={element.id ?? `element-${index}`}
                          className={`${elementClasses} design-shape`}
                          style={{
                            ...baseStyle,
                            width: diameter,
                            height: diameter,
                            borderRadius: "50%",
                            background: shapeEl.fill ?? "#f3f4f6",
                            border: shapeEl.stroke ? `1px solid ${shapeEl.stroke}` : undefined,
                            boxShadow: shapeEl.shadow,
                          }}
                          onMouseDown={(event) => handleElementMouseDown(event, index)}
                        />
                      );
                    }

                    if (shapeEl.shape === "polygon" && shapeEl.points?.length) {
                      const polygonPoints = shapeEl.points
                        .map((point) => {
                          const px = (point.x / BASE_WIDTH) * 100;
                          const py = (point.y / BASE_HEIGHT) * 100;
                          return `${px}% ${py}%`;
                        })
                        .join(", ");
                      return (
                        <div
                          key={element.id ?? `element-${index}`}
                          className={`${elementClasses} design-shape`}
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            width: BASE_WIDTH * scale,
                            height: canvasHeight,
                            background: shapeEl.fill ?? "#111827",
                            clipPath: `polygon(${polygonPoints})`,
                          }}
                          onMouseDown={(event) => handleElementMouseDown(event, index)}
                        />
                      );
                    }

                    return (
                      <div
                        key={element.id ?? `element-${index}`}
                        className={`${elementClasses} design-shape`}
                        style={{
                          ...baseStyle,
                          width: (shapeEl.width ?? 0) * scale,
                          height: (shapeEl.height ?? 0) * scale,
                          background: shapeEl.fill ?? "#f3f4f6",
                          borderRadius: (shapeEl.borderRadius ?? 0) * scale,
                          boxShadow: shapeEl.shadow,
                          backdropFilter: shapeEl.blur ? `blur(${shapeEl.blur}px)` : undefined,
                          border: shapeEl.stroke ? `1px solid ${shapeEl.stroke}` : undefined,
                        }}
                        onMouseDown={(event) => handleElementMouseDown(event, index)}
                      />
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          </div>
        </section>

        <aside className="template-customize-panel template-customize-panel--right">
          <div className="template-customize-panel-card">
            <h3>Edit selected</h3>
            {selectedElement ? (
              <div className="template-customize-controls">
                <div className="template-customize-control">
                  <label>Position</label>
                  <div className="template-customize-position">
                    <span>X: {Math.round(selectedElement.x ?? 0)}</span>
                    <span>Y: {Math.round(selectedElement.y ?? 0)}</span>
                  </div>
                </div>

                {selectedElement.type === "text" && (
                  <>
                    <div className="template-customize-control">
                      <label>Text</label>
                      <textarea
                        rows={4}
                        className="template-customize-textarea"
                        value={(selectedElement as TemplateTextElement).content ?? ""}
                        onChange={handleTextContentChange}
                      />
                    </div>
                    <div className="template-customize-control">
                      <label className="template-customize-color-label">
                        <PaletteRoundedIcon fontSize="small" />
                        Text color
                      </label>
                      <input
                        type="color"
                        value={(selectedElement as TemplateTextElement).color ?? "#111827"}
                        onChange={handleColorChange}
                      />
                    </div>
                  </>
                )}

                {selectedElement.type === "image" && (
                  <div className="template-customize-control">
                    <label>Image size (px)</label>
                    <div className="template-customize-size-row">
                      <div className="template-customize-size-field">
                        <span>W</span>
                        <input
                          type="number"
                          min={10}
                          max={2000}
                          value={Math.round((selectedElement as TemplateImageElement).width ?? 0)}
                          onChange={(event) => handleImageSizeChange("width", event)}
                        />
                      </div>
                      <div className="template-customize-size-field">
                        <span>H</span>
                        <input
                          type="number"
                          min={10}
                          max={3000}
                          value={Math.round((selectedElement as TemplateImageElement).height ?? 0)}
                          onChange={(event) => handleImageSizeChange("height", event)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedElement.type !== "text" && selectedElement.type !== "image" && (
                  <p className="template-customize-hint">
                    Drag elements on the canvas to reposition them.
                  </p>
                )}
              </div>
            ) : (
              <p className="template-customize-hint">
                Select an element from the canvas or the layer list to edit.
              </p>
            )}
          </div>

          <div className="template-customize-panel-card template-customize-panel-footer">
            <button type="button" className="template-customize-close" onClick={handleBack}>
              <CloseRoundedIcon fontSize="small" />
              Exit customization
            </button>
            <button
              type="button"
              className="btn btn--orange"
              onClick={handleSave}
              disabled={isSaving}
            >
              <SaveRoundedIcon fontSize="small" />
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}
