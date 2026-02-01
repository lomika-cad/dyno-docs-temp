import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Navbar from "../layouts/Navbar";
import "../styles/templates.css";
import "../styles/agencyData.css";
import { getTemplates } from "../services/template-api";
import { showError, showInfo } from "../components/Toast";
import { EyeIcon } from "lucide-react";
import { MonetizationOn } from "@mui/icons-material";
import { Divider } from "@mui/material";

type TemplateFilter = "all" | "free" | "paid";

type TemplateApiResponse = {
  id?: string;
  Id?: string;
  templateName?: string;
  TemplateName?: string;
  templateThumbnail?: string | null;
  TemplateThumbnail?: string | null;
  templateDesign?: string;
  TemplateDesign?: string;
  isPaid?: boolean;
  IsPaid?: boolean;
  price?: number | string | null;
  Price?: number | string | null;
};

type TemplateCardModel = {
  id: string;
  name: string;
  description: string;
  thumbnail: string | null;
  isPaid: boolean;
  priceLabel: string;
  designMarkup: string;
};

type FilterOption = {
  label: string;
  value: TemplateFilter;
};

const FILTER_OPTIONS: FilterOption[] = [
  { label: "All", value: "all" },
  { label: "Free", value: "free" },
  { label: "Paid", value: "paid" },
];

const FALLBACK_DESCRIPTION = "Smart layouts crafted for travel reports.";
const FALLBACK_PREVIEW = "<p style=\"color:#6b7280;font-size:14px\">No preview available for this template.</p>";
const LKR_FORMATTER = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const stripUnsafeMarkup = (markup: string) =>
  markup.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");

// Remove markup noise and condense whitespace from API provided design strings.
const sanitizeText = (text?: string | null) =>
  (text ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeTemplates = (payload: TemplateApiResponse[]): TemplateCardModel[] =>
  payload.map((template, index) => {
    const name = template.templateName ?? template.TemplateName ?? "Untitled Template";
    const rawDesign = template.templateDesign ?? template.TemplateDesign ?? "";
    const safeDesign = stripUnsafeMarkup(rawDesign).trim();
    const descriptionSource = rawDesign || FALLBACK_DESCRIPTION;
    const cleanedDescription = sanitizeText(descriptionSource) || FALLBACK_DESCRIPTION;
    const truncatedDescription =
      cleanedDescription.length > 110 ? `${cleanedDescription.slice(0, 110)}...` : cleanedDescription;

    const isPaid = template.isPaid ?? template.IsPaid ?? false;
    const priceRaw = template.price ?? template.Price ?? null;
    const priceNumber =
      typeof priceRaw === "number" ? priceRaw : priceRaw ? Number(priceRaw) : null;
    const priceLabel =
      isPaid && priceNumber !== null && !Number.isNaN(priceNumber)
        ? LKR_FORMATTER.format(priceNumber)
        : isPaid
        ? "Premium"
        : "Free";

    return {
      id: template.id ?? template.Id ?? `template-${index}`,
      name,
      description: truncatedDescription,
      thumbnail: template.templateThumbnail ?? template.TemplateThumbnail ?? null,
      isPaid,
      priceLabel,
      designMarkup: safeDesign || FALLBACK_PREVIEW,
    };
  });

export default function Templates() {
  const [templates, setTemplates] = useState<TemplateCardModel[]>([]);
  const [filter, setFilter] = useState<TemplateFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateCardModel | null>(null);

  useEffect(() => {
    let ignore = false;

    const fetchTemplates = async () => {
      setIsLoading(true);
      try {
        const response = await getTemplates();
        if (ignore) {
          return;
        }

        const raw = (response as { data?: unknown }).data;
        let payload: TemplateApiResponse[] = [];

        if (Array.isArray(raw)) {
          payload = raw as TemplateApiResponse[];
        } else if (
          raw &&
          typeof raw === "object" &&
          Array.isArray((raw as { data?: unknown }).data)
        ) {
          payload = ((raw as { data?: TemplateApiResponse[] }).data ?? []) as TemplateApiResponse[];
        }

        setTemplates(normalizeTemplates(payload));
        setError(null);
      } catch (err) {
        if (ignore) {
          return;
        }
        setError("Unable to load templates. Please try again.");
        showError("Unable to load templates. Please try again.");
        setTemplates([]);
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchTemplates();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredTemplates = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return templates.filter((template) => {
      const matchesFilter =
        filter === "all" ? true : filter === "paid" ? template.isPaid : !template.isPaid;
      const matchesSearch =
        term.length === 0 ||
        template.name.toLowerCase().includes(term) ||
        template.description.toLowerCase().includes(term);

      return matchesFilter && matchesSearch;
    });
  }, [filter, searchTerm, templates]);

  const handleAddTemplate = (template: TemplateCardModel) => {
    showInfo(`"${template.name}" added to your workspace.`);
  };

  const handleMyTemplatesClick = () => {
    showInfo("Personal template collections are coming soon.");
  };

  const handleResetFilters = () => {
    setFilter("all");
    setSearchTerm("");
  };

  const handleCardPreview = (template: TemplateCardModel) => {
    setPreviewTemplate(template);
  };

  const handleClosePreview = () => {
    setPreviewTemplate(null);
  };

  const showEmptyState = !isLoading && filteredTemplates.length === 0;

  return (
    <Navbar userName="User">
      <section className="templates-page">
        <div className="templates-hero">
          <div>
            <h2 className="agency__title">Template Marketplace</h2>
          </div>

          <button
            type="button"
            className="btn btn--orange"
            onClick={handleMyTemplatesClick}
          >
            <EyeIcon size={16} />
            My Templates
          </button>
        </div>

        <div className="templates-controls">
          <div className="template-tabs" role="tablist" aria-label="Filter templates">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="tab"
                className={`template-tab ${filter === option.value ? "template-tab--active" : ""}`}
                aria-selected={filter === option.value}
                onClick={() => setFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <label className="template-search" aria-label="Search templates">
            <span className="template-search__icon">
              <SearchRoundedIcon fontSize="small" />
            </span>
            <input
              type="search"
              placeholder="Search by name or style"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
        </div>

        <Divider />

        {error && (
          <div className="templates-alert" role="status">
            {error}
          </div>
        )}

        <div className="template-grid">
          {isLoading &&
            Array.from({ length: 6 }).map((_, index) => <TemplateSkeleton key={`skeleton-${index}`} />)}

          {!isLoading &&
            filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onAdd={handleAddTemplate}
                onPreview={handleCardPreview}
              />
            ))}
        </div>

        {showEmptyState && (
          <div className="templates-empty">
            <p>
              No templates match your filters. Adjust your search or explore all templates again.
            </p>
            <button type="button" onClick={handleResetFilters}>
              Reset filters
            </button>
          </div>
        )}

        {previewTemplate && (
          <TemplatePreviewModal
            template={previewTemplate}
            onClose={handleClosePreview}
          />
        )}
      </section>
    </Navbar>
  );
}

type TemplateCardProps = {
  template: TemplateCardModel;
  onAdd: (template: TemplateCardModel) => void;
  onPreview: (template: TemplateCardModel) => void;
};

function TemplateCard({ template, onAdd, onPreview }: TemplateCardProps) {
  const { name, description, thumbnail, isPaid, priceLabel } = template;
  const thumbnailSrc = thumbnail
    ? thumbnail.startsWith("data:")
      ? thumbnail
      : `data:image/png;base64,${thumbnail}`
    : null;

  const handleCardClick = () => {
    onPreview(template);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onPreview(template);
    }
  };

  const handleAddClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onAdd(template);
  };

  return (
    <article
      className={`template-card ${isPaid ? "template-card--premium" : "template-card--free"}`}
      aria-label={`${name} template`}
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
    >
      <div className="template-card__media">
        {thumbnailSrc ? (
          <img className="template-thumb" src={thumbnailSrc} alt={`${name} preview`} loading="lazy" />
        ) : (
          <div className="template-thumb template-thumb--fallback" aria-hidden="true">
            <span>{name.slice(0, 2).toUpperCase()}</span>
          </div>
        )}

        {isPaid && (
          <span className="template-card__crown" aria-label="Premium template">
            <WorkspacePremiumRoundedIcon fontSize="small" />
          </span>
        )}
      </div>

      <div className="template-card__content">
        <h3 className="template-title">{name}</h3>
      </div>

      <div className="template-card__actions">
        <button
          type="button"
          className="btn btn--orange"
          onClick={handleAddClick}
        >
          {isPaid ? <MonetizationOn fontSize="small" /> : <AddRoundedIcon fontSize="small" />}
          {isPaid ? "Purchase" : "Add Template"}
        </button>

        <div className="template-card__badges">
          <span
            className={`template-card__price-pill ${
              isPaid ? "template-card__price-pill--paid" : "template-card__price-pill--free"
            }`}
          >
            {isPaid ? "Paid" : "Free"}
          </span>
          {isPaid && <span className="template-card__price">{priceLabel}</span>}
        </div>
      </div>
    </article>
  );
}

type TemplatePreviewModalProps = {
  template: TemplateCardModel;
  onClose: () => void;
};

function TemplatePreviewModal({ template, onClose }: TemplatePreviewModalProps) {
  const parsedDesign = useMemo(() => parseDesign(template.designMarkup), [template.designMarkup]);

  const handleBackdropClick = () => {
    onClose();
  };

  const handlePanelClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <div className="template-modal" role="dialog" aria-modal="true" onClick={handleBackdropClick}>
      <div className="template-modal__panel" onClick={handlePanelClick}>
        <header className="template-modal__header">
          <div>
            <p className="template-modal__eyebrow">Template Preview</p>
            <h2>{template.name}</h2>
          </div>
          <button type="button" className="template-modal__close" onClick={onClose} aria-label="Close preview">
            <CloseRoundedIcon />
          </button>
        </header>

        <div className="template-modal__body">
          {parsedDesign ? (
            <TemplateDesignRenderer design={parsedDesign} />
          ) : (
            <pre className="template-modal__raw">{template.designMarkup}</pre>
          )}
        </div>
      </div>
    </div>
  );
}

function TemplateSkeleton() {
  return (
    <div className="template-card template-card--skeleton" aria-hidden="true">
      <div className="skeleton-block skeleton-block--thumb" />
      <div className="skeleton-block skeleton-block--title" />
      <div className="skeleton-block skeleton-block--text" />
      <div className="skeleton-pill-group">
        <span className="skeleton-pill" />
        <span className="skeleton-pill" />
      </div>
    </div>
  );
}

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
  shape?: "rectangle" | "line" | "polygon";
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

const SAMPLE_PLACEHOLDERS: Record<string, string> = {
  "{{report_title}}": "Summer Escape 2026",
  "{{customer_name}}": "Ayesha Fernando",
  "{{destination_city}}": "Bali",
  "{{destination_country}}": "Indonesia",
  "{{bottom_logo}}": "https://drive.google.com/file/d/1ezJue6VOcxvhvFZetr2Lk_QbyW0C2o5T/view?usp=sharing",
  "{{trip_length}}": "6",
  "{{traveler_count}}": "02",
  "{{summary_highlights}}":
    "Curated coastal experiences, private transfers, and bespoke dining that capture the essence of Bali.",
  "{{generated_date}}": "31 Jan 2026",
  "{{cover_image_url}}": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
};

const parseDesign = (markup: string): TemplateDesign | null => {
  try {
    const parsed = JSON.parse(markup);
    if (!parsed || !Array.isArray(parsed.pages)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

type TemplateDesignRendererProps = {
  design: TemplateDesign;
};

function TemplateDesignRenderer({ design }: TemplateDesignRendererProps) {
  const page = design.pages?.[0];
  if (!page) {
    return <pre className="template-modal__raw">No page definition found.</pre>;
  }

  const BASE_WIDTH = 595;
  const BASE_HEIGHT = 842;
  const TARGET_WIDTH = 720;
  const scale = Math.min(1, TARGET_WIDTH / BASE_WIDTH);
  const width = BASE_WIDTH * scale;
  const height = BASE_HEIGHT * scale;

  return (
    <div className="template-preview__canvas-wrapper">
      <div
        className="template-preview__canvas"
        style={{ width, height, background: design.background ?? "#ffffff" }}
      >
        {page.elements?.map((element, index) => (
          <TemplateDesignElementView
            key={element.id ?? index}
            element={element}
            scale={scale}
            canvasWidth={width}
            canvasHeight={height}
            baseWidth={BASE_WIDTH}
            baseHeight={BASE_HEIGHT}
          />
        ))}
      </div>
    </div>
  );
}

type TemplateDesignElementViewProps = {
  element: TemplateDesignElement;
  scale: number;
  canvasWidth: number;
  canvasHeight: number;
  baseWidth: number;
  baseHeight: number;
};

function TemplateDesignElementView({
  element,
  scale,
  canvasWidth,
  canvasHeight,
  baseWidth,
  baseHeight,
}: TemplateDesignElementViewProps) {
  if (!element || !element.type) {
    return null;
  }

  const baseStyle: CSSProperties = {
    left: (element.x ?? 0) * scale,
    top: (element.y ?? 0) * scale,
    width: element.width ? element.width * scale : undefined,
    height: element.height ? element.height * scale : undefined,
    position: "absolute",
  };

  if (element.type === "text") {
    const textEl = element as TemplateTextElement;
    return (
      <div
        className="design-text"
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
      >
        {resolvePlaceholders(textEl.content ?? "")}
      </div>
    );
  }

  if (element.type === "image") {
    const imageEl = element as TemplateImageElement;
    return (
      <img
        className="design-image"
        style={{
          ...baseStyle,
          borderRadius: (imageEl.borderRadius ?? 0) * scale,
        }}
        src={resolveImageSource(imageEl.src, imageEl.fallback)}
        alt={imageEl.id ?? "Template preview"}
      />
    );
  }

  if (element.type === "pill") {
    const pillEl = element as TemplatePillElement;
    return (
      <div
        className="design-pill"
        style={{
          ...baseStyle,
          background: pillEl.colors?.bg ?? "#ffffff",
          color: pillEl.colors?.text ?? "#111827",
          borderColor: `${(pillEl.colors?.text ?? "#111827")}30`,
        }}
      >
        <span className="design-pill__label">{pillEl.label}</span>
        <span className="design-pill__value">{resolvePlaceholders(pillEl.value ?? "")}</span>
      </div>
    );
  }

  if (element.type === "shape") {
    const shapeEl = element as TemplateShapeElement;
    if (shapeEl.shape === "line") {
      return (
        <div
          className="design-shape design-shape--line"
          style={{
            ...baseStyle,
            height: Math.max(1, (shapeEl.height ?? 1) * scale),
            background: shapeEl.stroke ?? shapeEl.fill ?? "#e5e7eb",
          }}
        />
      );
    }

    if (shapeEl.shape === "polygon" && shapeEl.points?.length) {
      const polygonPoints = shapeEl.points
        .map((point) => {
          const px = (point.x / baseWidth) * 100;
          const py = (point.y / baseHeight) * 100;
          return `${px}% ${py}%`;
        })
        .join(", ");
      return (
        <div
          className="design-shape"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: canvasWidth,
            height: canvasHeight,
            background: shapeEl.fill ?? "#111827",
            clipPath: `polygon(${polygonPoints})`,
          }}
        />
      );
    }

    return (
      <div
        className="design-shape"
        style={{
          ...baseStyle,
          width: (shapeEl.width ?? 0) * scale,
          height: (shapeEl.height ?? 0) * scale,
          background: shapeEl.fill ?? "#f3f4f6",
          borderRadius: (shapeEl.borderRadius ?? 0) * scale,
          boxShadow: shapeEl.shadow,
          backdropFilter: shapeEl.blur ? `blur(${shapeEl.blur}px)` : undefined,
        }}
      />
    );
  }

  return null;
}

const resolvePlaceholders = (value: string) => {
  let result = value;
  Object.entries(SAMPLE_PLACEHOLDERS).forEach(([placeholder, sample]) => {
    result = result.replace(new RegExp(placeholder, "g"), sample);
  });
  return result;
};

const resolveImageSource = (src?: string, fallback?: string) => {
  if (!src) {
    return fallback ?? SAMPLE_PLACEHOLDERS["{{cover_image_url}}"];
  }
  if (src.startsWith("http") || src.startsWith("data:")) {
    return src;
  }
  return SAMPLE_PLACEHOLDERS[src] ?? fallback ?? SAMPLE_PLACEHOLDERS["{{cover_image_url}}"];
};