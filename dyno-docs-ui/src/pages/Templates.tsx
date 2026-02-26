import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import JSON5 from "json5";
import Navbar from "../layouts/Navbar";
import "../styles/templates.css";
import "../styles/agencyData.css";
import { assignTemplate, getTemplates, getUserTemplates, unassignTemplate } from "../services/template-api";
import { showError, showInfo, showSuccess } from "../components/Toast";
import CardPayment from "../components/CardPayment";
import { EyeIcon } from "lucide-react";
import { MonetizationOn } from "@mui/icons-material";
import { Divider } from "@mui/material";
import { getTenantInfo } from "../services/auth-api";
import { getMe } from "../services/me-api";

type TemplateFilter = "all" | "free" | "paid";

type TemplateApiResponse = {
  id?: string;
  Id?: string;
  userTemplateId?: string;
  UserTemplateId?: string;
  assignmentId?: string;
  AssignmentId?: string;
  templateId?: string;
  TemplateId?: string;
  templateID?: string;
  TemplateID?: string;
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
  templateId: string;
  name: string;
  description: string;
  thumbnail: string | null;
  isPaid: boolean;
  priceLabel: string;
  priceValue: number | null;
  designMarkup: string;
};

type UserSession = {
  userId: string;
  token: string;
};

type TenantProfile = {
  agencyLogo?: string | null;
  agencyName?: string | null;
  contactNo?: string | null;
  agencyAddress?: string | null;
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

const DEFAULT_ASSIGNMENT_DESIGN = `{
  "version": "1.0",
  "pageSize": "A4",
  "background": "#ffffff",
  "pages": [
    {
      "pageNumber": 1,
      "elements": [
        {
          "id": "header_strip",
          "type": "shape",
          "shape": "rectangle",
          "x": 0,
          "y": 0,
          "width": 595,
          "height": 130,
          "fill": "#ffffff"
        },
        {
          "id": "brand_mark",
          "type": "image",
          "x": 470,
          "y": 25,
          "width": 80,
          "height": 80,
          "borderRadius": 12,
          "src": "{{agency_logo_url}}",
          "fallback": "{{agency_logo_url}}"
        },
        {
          "id": "title_text",
          "type": "text",
          "x": 40,
          "y": 30,
          "fontSize": 34,
          "fontFamily": "Playfair Display, serif",
          "fontWeight": 600,
          "color": "#111827",
          "content": "{{agency_name}}"
        },
        {
          "id": "subtitle_text",
          "type": "text",
          "x": 40,
          "y": 75,
          "fontSize": 18,
          "fontFamily": "Poppins, sans-serif",
          "fontWeight": 500,
          "color": "#b3b6c3",
          "content": "Welcome to Sri Lanka"
        },
        {
          "id": "hero_photo",
          "type": "image",
          "x": 0,
          "y": 130,
          "width": 595,
          "height": 540,
          "src": "{{hero_image_url}}",
          "fallback": "{{hero_image_url}}"
        },
        {
          "id": "footer_texture",
          "type": "image",
          "x": 0,
          "y": 670,
          "width": 595,
          "height": 172,
          "src": "{{footer_texture_url}}",
          "fallback": "{{footer_texture_url}}"
        },
        {
          "id": "footer_overlay",
          "type": "shape",
          "shape": "rectangle",
          "x": 0,
          "y": 670,
          "width": 595,
          "height": 172,
          "fill": "#ffffff"
        },
        {
          "id": "contact_box",
          "type": "shape",
          "shape": "rectangle",
          "x": 30,
          "y": 690,
          "width": 330,
          "height": 120,
          "borderRadius": 16,
          "fill": "rgba(255,255,255,0.92)"
        },
        {
          "id": "contact_phone_icon",
          "type": "shape",
          "shape": "circle",
          "x": 50,
          "y": 712,
          "width": 30,
          "height": 30,
          "fill": "#000000"
        },
        {
          "id": "contact_phone_icon_text",
          "type": "text",
          "x": 57,
          "y": 716,
          "fontSize": 16,
          "fontFamily": "Poppins, sans-serif",
          "fontWeight": 600,
          "color": "#ffffff",
          "content": "\\u260E"
        },
        {
          "id": "contact_phone_text",
          "type": "text",
          "x": 92,
          "y": 715,
          "fontSize": 14,
          "fontFamily": "Inter, sans-serif",
          "fontWeight": 600,
          "color": "#1f2937",
          "content": "{{contact_phone}}"
        },
        {
          "id": "contact_web_icon",
          "type": "shape",
          "shape": "circle",
          "x": 50,
          "y": 750,
          "width": 30,
          "height": 30,
          "fill": "#000000"
        },
        {
          "id": "contact_web_icon_text",
          "type": "text",
          "x": 55,
          "y": 754,
          "fontSize": 16,
          "fontFamily": "Poppins, sans-serif",
          "fontWeight": 600,
          "color": "#ffffff",
          "content": "\\uD83C\\uDF10"
        },
        {
          "id": "contact_web_text",
          "type": "text",
          "x": 92,
          "y": 752,
          "fontSize": 13,
          "fontFamily": "Inter, sans-serif",
          "color": "#1f2937",
          "content": "{{contact_website}}"
        },
        {
          "id": "contact_address_icon",
          "type": "shape",
          "shape": "circle",
          "x": 50,
          "y": 788,
          "width": 30,
          "height": 30,
          "fill": "#000000"
        },
        {
          "id": "contact_address_icon_text",
          "type": "text",
          "x": 55,
          "y": 792,
          "fontSize": 16,
          "fontFamily": "Poppins, sans-serif",
          "fontWeight": 600,
          "color": "#ffffff",
          "content": "\\uD83D\\uDCCD"
        },
        {
          "id": "contact_address_text",
          "type": "text",
          "x": 92,
          "y": 792,
          "fontSize": 13,
          "fontFamily": "Inter, sans-serif",
          "color": "#1f2937",
          "content": "{{contact_address}}"
        },
        {
          "id": "footer_logo",
          "type": "image",
          "x": 470,
          "y": 700,
          "width": 90,
          "height": 90,
          "src": "{{tourism_board_logo}}",
          "fallback": "{{tourism_board_logo}}"
        }
      ]
    }
  ]
}`;

const stripUnsafeMarkup = (markup: string) =>
  markup.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");

// Remove markup noise and condense whitespace from API provided design strings.
const sanitizeText = (text?: string | null) =>
  (text ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const toNonEmptyString = (value?: string | null) => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const resolveTemplateIdentifiers = (
  entity: TemplateApiResponse | undefined,
  defaults: { assignmentId: string; templateId: string },
) => {
  const templateIdCandidates = [
    entity?.templateId,
    entity?.TemplateId,
    entity?.templateID,
    entity?.TemplateID,
    entity?.id,
    entity?.Id,
  ];
  const resolvedTemplateId =
    templateIdCandidates.map(toNonEmptyString).find((value) => value) ?? defaults.templateId;

  const assignmentIdCandidates = [
    entity?.userTemplateId,
    entity?.UserTemplateId,
    entity?.assignmentId,
    entity?.AssignmentId,
    entity?.id,
    entity?.Id,
  ];
  const resolvedAssignmentId =
    assignmentIdCandidates.map(toNonEmptyString).find((value) => value) ?? defaults.assignmentId;

  return {
    templateId: resolvedTemplateId,
    assignmentId: resolvedAssignmentId,
  };
};

const normalizeTemplates = (payload: TemplateApiResponse[]): TemplateCardModel[] =>
  payload.map((template, index) => {
    const fallbackAssignmentId = template.id ?? template.Id ?? `template-${index}`;
    // TemplateId should always come from backend Id/TemplateId fields, never from synthetic keys
    const fallbackTemplateId = template.templateId ?? template.TemplateId ?? template.id ?? template.Id ?? "";
    const { assignmentId, templateId } = resolveTemplateIdentifiers(template, {
      assignmentId: fallbackAssignmentId,
      templateId: fallbackTemplateId,
    });
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
    const normalizedPrice =
      typeof priceNumber === "number" && !Number.isNaN(priceNumber) ? priceNumber : null;
    const priceLabel =
      isPaid && normalizedPrice !== null
        ? new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }).format(normalizedPrice)
        : isPaid
          ? "Premium"
          : "Free";

    return {
      id: assignmentId,
      templateId,
      name,
      description: truncatedDescription,
      thumbnail: template.templateThumbnail ?? template.TemplateThumbnail ?? null,
      isPaid,
      priceLabel,
      priceValue: isPaid ? normalizedPrice : null,
      designMarkup: safeDesign || FALLBACK_PREVIEW,
    };
  });

const extractTemplatesPayload = (rawResponse: unknown): TemplateApiResponse[] => {
  if (Array.isArray(rawResponse)) {
    return rawResponse as TemplateApiResponse[];
  }

  if (
    rawResponse &&
    typeof rawResponse === "object" &&
    Array.isArray((rawResponse as { data?: unknown }).data)
  ) {
    return ((rawResponse as { data?: TemplateApiResponse[] }).data ?? []) as TemplateApiResponse[];
  }

  return [];
};

const resolveApiErrorMessage = (err: unknown) =>
  (err as { response?: { data?: { message?: string; Message?: string } } })?.response?.data?.message ??
  (err as { response?: { data?: { message?: string; Message?: string } } })?.response?.data?.Message ??
  null;

const getAssignmentDesign = (template: TemplateCardModel) => {
  const markup = template.designMarkup?.trim();
  if (markup && markup !== FALLBACK_PREVIEW) {
    return markup;
  }
  return DEFAULT_ASSIGNMENT_DESIGN;
};

export default function Templates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<TemplateCardModel[]>([]);
  const [filter, setFilter] = useState<TemplateFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateCardModel | null>(null);
  const [paymentTemplate, setPaymentTemplate] = useState<TemplateCardModel | null>(null);
  const [pendingAssignment, setPendingAssignment] = useState<TemplateCardModel | null>(null);
  const [assigningTemplateId, setAssigningTemplateId] = useState<string | null>(null);
  const [isMyTemplatesModalOpen, setIsMyTemplatesModalOpen] = useState(false);
  const [myTemplates, setMyTemplates] = useState<TemplateCardModel[]>([]);
  const [isLoadingMyTemplates, setIsLoadingMyTemplates] = useState(false);
  const [myTemplatesError, setMyTemplatesError] = useState<string | null>(null);
  const [hasLoadedMyTemplates, setHasLoadedMyTemplates] = useState(false);
  const [tenantPlaceholders, setTenantPlaceholders] = useState<PlaceholderMap>(DEFAULT_PLACEHOLDERS);
  const [hasTenantPlaceholders, setHasTenantPlaceholders] = useState(false);
  const [previewPlaceholders, setPreviewPlaceholders] = useState<PlaceholderMap>(DEFAULT_PLACEHOLDERS);
  const [templateToUnassign, setTemplateToUnassign] = useState<TemplateCardModel | null>(null);
  const [isUnassigning, setIsUnassigning] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const tenantPlaceholderPromiseRef = useRef<Promise<PlaceholderMap> | null>(null);

  const resolveUserSession = (): UserSession | null => {
    const token = sessionStorage.getItem("dd_token");
    const userId = sessionStorage.getItem("dd_user_id");

    if (!token || !userId) {
      showError("Please sign in to view your templates.");
      return null;
    }

    return { userId, token };
  };

  const ensureTenantPlaceholders = async (): Promise<PlaceholderMap> => {
    if (hasTenantPlaceholders) {
      return tenantPlaceholders;
    }

    if (tenantPlaceholderPromiseRef.current) {
      return tenantPlaceholderPromiseRef.current;
    }

    const tenantId = sessionStorage.getItem("dd_tenant_id");
    if (!tenantId) {
      return tenantPlaceholders;
    }

    const fetchPromise = (async () => {
      try {
        const tenantInfo = (await getTenantInfo(tenantId)) as TenantProfile;
        const mapped = buildTenantPlaceholders(tenantInfo);
        setTenantPlaceholders(mapped);
        setHasTenantPlaceholders(true);
        return mapped;
      } catch (error) {
        console.error("Failed to fetch tenant info:", error);
        return tenantPlaceholders;
      } finally {
        tenantPlaceholderPromiseRef.current = null;
      }
    })();

    tenantPlaceholderPromiseRef.current = fetchPromise;
    return fetchPromise;
  };

  const fetchUserTemplates = async ({ userId, token }: UserSession) => {
    setIsLoadingMyTemplates(true);
    setMyTemplatesError(null);
    try {
      const response = await getUserTemplates(userId, token);
      const payload = extractTemplatesPayload(response ?? []);
      const normalized = normalizeTemplates(payload);
      setMyTemplates(normalized);
      setHasLoadedMyTemplates(true);
    } catch (err) {
      const message =
        resolveApiErrorMessage(err) ?? "Unable to load your templates. Please try again.";
      setMyTemplates([]);
      setMyTemplatesError(message);
      showError(message);
    } finally {
      setIsLoadingMyTemplates(false);
    }
  };

  const appendTemplateToLibrary = (template: TemplateCardModel) => {
    setMyTemplates((current) => {
      if (!hasLoadedMyTemplates) {
        return current;
      }

      const exists = current.some((entry) => entry.id === template.id);
      if (exists) {
        return current;
      }

      return [template, ...current];
    });
  };

  const removeTemplateFromLibrary = (assignmentId: string) => {
    setMyTemplates((current) => current.filter((entry) => entry.id !== assignmentId));
  };

  useEffect(() => {
    let ignore = false;

    const fetchTemplates = async () => {
      setIsLoading(true);
      try {
        const response = await getTemplates(sessionStorage.getItem("dd_token") ?? "");
        if (ignore) {
          return;
        }

        const payload = extractTemplatesPayload(
          (response as { data?: unknown })?.data ?? response,
        );

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

  const handleAddTemplateRequest = (template: TemplateCardModel) => {
    setPendingAssignment(template);
  };

  const handleCloseAssignmentModal = () => {
    if (assigningTemplateId) {
      return;
    }
    setPendingAssignment(null);
  };

  const handleConfirmAssignment = async () => {
    if (!pendingAssignment) {
      return;
    }

    const token = sessionStorage.getItem("dd_token");
    const userId = sessionStorage.getItem("dd_user_id");

    if (!token || !userId) {
      showError("Please sign in to add templates to your workspace.");
      return;
    }

    const assignmentPlaceholders = await ensureTenantPlaceholders();

    const payload = {
      userId,
      templateId: pendingAssignment.templateId,
      templateDesign: finalizeTemplateDesign(
        getAssignmentDesign(pendingAssignment),
        assignmentPlaceholders,
      ),
      tenantId: sessionStorage.getItem("dd_tenant_id") ?? undefined,
    };

    try {
      setAssigningTemplateId(pendingAssignment.id);
      const response = await assignTemplate(payload, token);
      const identifiers = resolveTemplateIdentifiers(response as TemplateApiResponse, {
        assignmentId: pendingAssignment.id,
        templateId: pendingAssignment.templateId,
      });
      const normalizedAssignment: TemplateCardModel = {
        ...pendingAssignment,
        id: identifiers.assignmentId,
        templateId: identifiers.templateId,
      };
      const successMessage =
        (response as { message?: string; Message?: string })?.message ??
        (response as { message?: string; Message?: string })?.Message ??
        `"${pendingAssignment.name}" assigned to your workspace.`;
      showSuccess(successMessage);
      appendTemplateToLibrary(normalizedAssignment);
      setPendingAssignment(null);
      handleMe();
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      const apiMessage = resolveApiErrorMessage(err);
      showError(apiMessage ?? "Unable to assign template. Please try again.");
      console.error("assignTemplate failed", err);
    } finally {
      setAssigningTemplateId(null);
    }
  };

  const handleMe = async () => {
    try {
      const res = await getMe(sessionStorage.getItem("dd_token") ?? "", sessionStorage.getItem("dd_tenant_id") ?? "");
      console.log(res);
      sessionStorage.setItem("dd_template_limit", res.templatesLimit);
    } catch (error) {
      console.error(error);
    }
  }

  const handleMyTemplatesClick = async () => {
    const session = resolveUserSession();
    if (!session) {
      return;
    }

    setIsMyTemplatesModalOpen(true);
    await Promise.all([fetchUserTemplates(session), ensureTenantPlaceholders()]);
  };

  const handleReloadMyTemplates = async () => {
    const session = resolveUserSession();
    if (!session) {
      setIsMyTemplatesModalOpen(false);
      return;
    }
    await Promise.all([fetchUserTemplates(session), ensureTenantPlaceholders()]);
  };

  const handleCloseMyTemplatesModal = () => {
    setIsMyTemplatesModalOpen(false);
  };

  const handleResetFilters = () => {
    setFilter("all");
    setSearchTerm("");
  };

  const handleCardPreview = (template: TemplateCardModel, useTenantData = false) => {
    setPreviewTemplate(template);

    if (useTenantData) {
      const active = hasTenantPlaceholders ? tenantPlaceholders : DEFAULT_PLACEHOLDERS;
      setPreviewPlaceholders(active);

      if (!hasTenantPlaceholders) {
        ensureTenantPlaceholders().then((resolved) => {
          setPreviewPlaceholders(resolved);
        });
      }
      return;
    }

    setPreviewPlaceholders(DEFAULT_PLACEHOLDERS);
  };

  const handleCustomizeTemplate = (template: TemplateCardModel) => {
    navigate("/templates/customize", { state: { template } });
  };

  const handleClosePreview = () => {
    setPreviewTemplate(null);
  };

  const handleUnassignTemplateRequest = (template: any) => {
    console.log(template);

    setTemplateToUnassign(template);
  };

  const handleCloseUnassignModal = () => {
    if (isUnassigning) {
      return;
    }
    setTemplateToUnassign(null);
  };

  const handleConfirmUnassign = async () => {
    if (!templateToUnassign) {
      return;
    }

    const session = resolveUserSession();
    if (!session) {
      setTemplateToUnassign(null);
      return;
    }

    setIsUnassigning(true);
    const payload = {
      userId: session.userId,
      templateId: templateToUnassign.templateId,
      tenantId: sessionStorage.getItem("dd_tenant_id") ?? undefined,
    };

    try {
      const response = await unassignTemplate(payload, session.token);
      const successMessage =
        (response as { message?: string; Message?: string })?.message ??
        (response as { message?: string; Message?: string })?.Message ??
        `"${templateToUnassign.name}" removed from your workspace.`;
      showSuccess(successMessage);
      removeTemplateFromLibrary(templateToUnassign.id);
      if (previewTemplate?.id === templateToUnassign.id) {
        setPreviewTemplate(null);
      }
      setTemplateToUnassign(null);
      handleMe();
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      const apiMessage = resolveApiErrorMessage(err);
      showError(apiMessage ?? "Unable to unassign template. Please try again.");
      console.error("unassignTemplate failed", err);
    } finally {
      setIsUnassigning(false);
    }
  };

  const handlePurchaseTemplate = (template: TemplateCardModel) => {
    if (template.priceValue === null) {
      showError("Pricing information is not available for this template yet.");
      return;
    }
    setPaymentTemplate(template);
  };

  const handleClosePayment = () => {
    setPaymentTemplate(null);
  };

  const handlePaymentSuccess = async (purchasedTemplate: TemplateCardModel) => {

    const token = sessionStorage.getItem("dd_token");
    const userId = sessionStorage.getItem("dd_user_id");

    if (!token || !userId) {
      showError("Payment received, but you must sign in to assign the template.");
      return;
    }

    const assignmentPlaceholders = await ensureTenantPlaceholders();

    const payload = {
      userId,
      templateId: purchasedTemplate.templateId,
      templateDesign: finalizeTemplateDesign(
        getAssignmentDesign(purchasedTemplate),
        assignmentPlaceholders,
      ),
    };

    try {
      setAssigningTemplateId(purchasedTemplate.id);
      const response = await assignTemplate(payload, token);
      const identifiers = resolveTemplateIdentifiers(response as TemplateApiResponse, {
        assignmentId: purchasedTemplate.id,
        templateId: purchasedTemplate.templateId,
      });
      const normalizedAssignment: TemplateCardModel = {
        ...purchasedTemplate,
        id: identifiers.assignmentId,
        templateId: identifiers.templateId,
      };
      const successMessage =
        (response as { message?: string; Message?: string })?.message ??
        (response as { message?: string; Message?: string })?.Message ??
        `"${purchasedTemplate.name}" assigned to your workspace.`;
      showSuccess(successMessage);
      showInfo(`"${purchasedTemplate.name}" unlocked. Check your workspace for the template shortly.`);
      appendTemplateToLibrary(normalizedAssignment);
      setPaymentTemplate(null);
    } catch (err) {
      const apiMessage = resolveApiErrorMessage(err);
      showError(apiMessage ?? "Payment succeeded, but template assignment failed. Please try again.");
      console.error("assignTemplate after payment failed", err);
    } finally {
      setAssigningTemplateId(null);
    }
  };

  const showEmptyState = !isLoading && filteredTemplates.length === 0;

  return (
    <Navbar>
      <section className="templates-page">
        <div className="templates-hero">
          <div className="agency-header">
            <h2 className="agency-title">Template Marketplace</h2>
            <button
              type="button"
              className="infoBtn"
              aria-label="Template marketplace steps"
              onClick={() => setInfoOpen(true)}
            >
              <InfoOutlinedIcon fontSize="small" />
            </button>
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
            <span className="template-search-icon">
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
                onAddRequest={handleAddTemplateRequest}
                onPurchase={handlePurchaseTemplate}
                onPreview={handleCardPreview}
                isAssigning={assigningTemplateId === template.id}
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

        {infoOpen && (
          <div className="ddModal" role="dialog" aria-modal="true" aria-label="Template marketplace guide">
            <button
              type="button"
              className="ddModal-backdrop"
              aria-label="Close"
              onClick={() => setInfoOpen(false)}
            />

            <div className="ddModal-card">
              <div className="ddModal-title">Template Marketplace Guide</div>
              <div className="ddModal-subtitle" style={{ textAlign: "left", marginTop: 8 }}>
                How to explore and assign templates:
              </div>
              <div className="ddModal-content">
                <ol>
                  <li>Use the tabs and search to narrow down All, Free, or Paid templates.</li>
                  <li>Select a card to preview the full design before committing.</li>
                  <li>Assign free templates instantly or purchase premium ones to unlock them.</li>
                  <li>Visit "My Templates" to review, customize, or unassign previously added designs.</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {isMyTemplatesModalOpen && (
          <MyTemplatesModal
            templates={myTemplates}
            isLoading={isLoadingMyTemplates}
            error={myTemplatesError}
            onClose={handleCloseMyTemplatesModal}
            onPreviewAssigned={(template) => handleCardPreview(template, true)}
            onCustomize={handleCustomizeTemplate}
            onReload={handleReloadMyTemplates}
            onUnassignRequest={handleUnassignTemplateRequest}
            isUnassigning={isUnassigning}
            unassigningTemplateId={templateToUnassign?.id ?? null}
          />
        )}

        {previewTemplate && (
          <TemplatePreviewModal
            template={previewTemplate}
            placeholders={previewPlaceholders}
            onClose={handleClosePreview}
          />
        )}

        {paymentTemplate && (
          <TemplatePaymentModal
            template={paymentTemplate}
            onClose={handleClosePayment}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}

        {pendingAssignment && (
          <TemplateAssignConfirmModal
            template={pendingAssignment}
            isSubmitting={assigningTemplateId === pendingAssignment.id}
            onConfirm={handleConfirmAssignment}
            onCancel={handleCloseAssignmentModal}
          />
        )}

        {templateToUnassign && (
          <TemplateUnassignConfirmModal
            template={templateToUnassign}
            isSubmitting={isUnassigning}
            onConfirm={handleConfirmUnassign}
            onCancel={handleCloseUnassignModal}
          />
        )}
      </section>
    </Navbar>
  );
}

type TemplateCardProps = {
  template: TemplateCardModel;
  onAddRequest?: (template: TemplateCardModel) => void;
  onPurchase?: (template: TemplateCardModel) => void;
  onPreview: (template: TemplateCardModel) => void;
  onEditRequest?: (template: TemplateCardModel) => void;
  isAssigning?: boolean;
  variant?: "marketplace" | "assigned";
  onUnassignRequest?: (template: TemplateCardModel) => void;
  isUnassigning?: boolean;
  unassigningTemplateId?: string | null;
};

function TemplateCard({
  template,
  onAddRequest,
  onPurchase,
  onPreview,
  onEditRequest,
  isAssigning = false,
  variant = "marketplace",
  onUnassignRequest,
  isUnassigning = false,
  unassigningTemplateId = null,
}: TemplateCardProps) {
  const { name, thumbnail, isPaid, priceLabel } = template;
  const thumbnailSrc = thumbnail
    ? thumbnail.startsWith("data:")
      ? thumbnail
      : `data:image/png;base64,${thumbnail}`
    : null;
  const isAssignedCard = variant === "assigned";
  const isUnassigningThisTemplate =
    isAssignedCard && isUnassigning && unassigningTemplateId === template.id;

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
    if (isAssignedCard) {
      onPreview(template);
      return;
    }

    if (isPaid) {
      onPurchase?.(template);
      return;
    }

    onAddRequest?.(template);
  };

  const handleUnassignClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!isAssignedCard || !onUnassignRequest) {
      return;
    }
    onUnassignRequest(template);
  };

  const handleEditClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!isAssignedCard) {
      return;
    }
    if (onEditRequest) {
      onEditRequest(template);
      return;
    }
    onPreview(template);
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
      <div className="template-card-media">
        {thumbnailSrc ? (
          <img className="template-thumb" src={thumbnailSrc} alt={`${name} preview`} loading="lazy" />
        ) : (
          <div className="template-thumb template-thumb--fallback" aria-hidden="true">
            <span>{name.slice(0, 2).toUpperCase()}</span>
          </div>
        )}

        {isPaid && (
          <span className="template-card-crown" aria-label="Premium template">
            <WorkspacePremiumRoundedIcon fontSize="small" />
          </span>
        )}

        {isAssignedCard && (
          <button
            type="button"
            className="template-card-overlay-action"
            onClick={handleEditClick}
            aria-label={`Customize ${name}`}
            data-tooltip="Customize template"
          >
            <EditRoundedIcon fontSize="small" />
            <span>Customize</span>
          </button>
        )}
      </div>

      <div className="template-card-content">
        <h3 className="template-title">{name}</h3>
      </div>

      <div className="template-card-actions">
        <div className="template-card-action-buttons">
          <button
            type="button"
            className="btn btn--orange"
            onClick={handleAddClick}
            disabled={!isAssignedCard && !isPaid && isAssigning}
          >
            {isAssignedCard ? (
              <>
                <EyeIcon size={16} />
                View Template
              </>
            ) : (
              <>
                {isPaid ? <MonetizationOn fontSize="small" /> : <AddRoundedIcon fontSize="small" />}
                {isPaid ? "Purchase" : isAssigning ? "Assigning..." : "Add Template"}
              </>
            )}
          </button>

          {isAssignedCard && onUnassignRequest && (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={handleUnassignClick}
              disabled={isUnassigningThisTemplate}
            >
              {isUnassigningThisTemplate ? "Removing..." : "Unassign"}
            </button>
          )}
        </div>

        <div className="template-card-badges">
          {!(isAssignedCard && !isPaid) && (
            <span
              className={`template-card-price-pill ${isPaid ? "template-card-price-pill--paid" : "template-card-price-pill--free"
                }`}
            >
              {isPaid ? "Paid" : "Free"}
            </span>
          )}
          {isPaid && <span className="template-card-price">{priceLabel}</span>}
        </div>
      </div>
    </article>
  );
}

type TemplatePreviewModalProps = {
  template: TemplateCardModel;
  placeholders: PlaceholderMap;
  onClose: () => void;
};

function TemplatePreviewModal({ template, placeholders, onClose }: TemplatePreviewModalProps) {
  const parsedDesign = useMemo(() => parseDesign(template.designMarkup), [template.designMarkup]);

  const handleBackdropClick = () => {
    onClose();
  };

  const handlePanelClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <div className="template-modal" role="dialog" aria-modal="true" onClick={handleBackdropClick}>
      <div className="template-modal-panel" onClick={handlePanelClick}>
        <header className="template-modal-header">
          <div>
            <p className="template-modal-eyebrow">Template Preview</p>
            <h2>{template.name}</h2>
          </div>
          <button type="button" className="template-modal-close" onClick={onClose} aria-label="Close preview">
            <CloseRoundedIcon />
          </button>
        </header>

        <div className="template-modal-body">
          {parsedDesign ? (
            <TemplateDesignRenderer design={parsedDesign} placeholders={placeholders} />
          ) : (
            <pre className="template-modal-raw">{template.designMarkup}</pre>
          )}
        </div>
      </div>
    </div>
  );
}

type MyTemplatesModalProps = {
  templates: TemplateCardModel[];
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onPreviewAssigned: (template: TemplateCardModel) => void;
  onCustomize: (template: TemplateCardModel) => void;
  onReload: () => void;
  onUnassignRequest: (template: TemplateCardModel) => void;
  isUnassigning: boolean;
  unassigningTemplateId: string | null;
};

function MyTemplatesModal({
  templates,
  isLoading,
  error,
  onClose,
  onPreviewAssigned,
  onCustomize,
  onReload,
  onUnassignRequest,
  isUnassigning,
  unassigningTemplateId,
}: MyTemplatesModalProps) {
  const handleBackdropClick = () => {
    onClose();
  };

  const handlePanelClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const hasNoTemplates = !isLoading && !error && templates.length === 0;

  return (
    <div className="template-modal" role="dialog" aria-modal="true" onClick={handleBackdropClick}>
      <div className="template-modal-panel" style={{ maxWidth: "960px" }} onClick={handlePanelClick}>
        <header className="template-modal-header">
          <div>
            <p className="template-modal-eyebrow">Assigned Templates</p>
            <h2>My Templates</h2>
          </div>
          <button type="button" className="template-modal-close" onClick={onClose} aria-label="Close my templates">
            <CloseRoundedIcon />
          </button>
        </header>

        <div className="template-modal-body template-modal-body--my-templates">
          {isLoading && (
            <div className="templates-empty">
              <p>Loading your templates...</p>
            </div>
          )}

          {!isLoading && error && (
            <div className="templates-empty">
              <p>{error}</p>
              <button type="button" className="btn btn--orange" onClick={onReload}>
                Try again
              </button>
            </div>
          )}

          {hasNoTemplates && (
            <div className="templates-empty">
              <p>You have not assigned any templates yet.</p>
            </div>
          )}

          {!isLoading && !error && templates.length > 0 && (
            <div className="template-grid">
              {templates.map((template) => (
                <TemplateCard
                  key={`my-${template.id}`}
                  template={template}
                  onPreview={onPreviewAssigned}
                  onEditRequest={onCustomize}
                  onUnassignRequest={onUnassignRequest}
                  isUnassigning={isUnassigning}
                  unassigningTemplateId={unassigningTemplateId}
                  variant="assigned"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type TemplatePaymentModalProps = {
  template: TemplateCardModel;
  onClose: () => void;
  onPaymentSuccess: (template: TemplateCardModel) => void;
};

function TemplatePaymentModal({ template, onClose, onPaymentSuccess }: TemplatePaymentModalProps) {
  const handleBackdropClick = () => {
    onClose();
  };

  const handlePanelClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <div className="template-modal" role="dialog" aria-modal="true" onClick={handleBackdropClick}>
      <div className="template-modal-panel template-modal-panel--payment" onClick={handlePanelClick}>
        <header className="template-modal-header">
          <div>
            <p className="template-modal-eyebrow">Secure Checkout</p>
            <h2>{template.name}</h2>
          </div>
          <button type="button" className="template-modal-close" onClick={onClose} aria-label="Close checkout">
            <CloseRoundedIcon />
          </button>
        </header>

        <div className="template-modal-body template-modal-body--payment">
          <div className="template-payment-grid">
            <CardPayment totalAmount={template.priceValue ?? 0} onPaid={() => onPaymentSuccess(template)} />
          </div>
        </div>
      </div>
    </div>
  );
}

type TemplateAssignConfirmModalProps = {
  template: TemplateCardModel;
  isSubmitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

function TemplateAssignConfirmModal({ template, isSubmitting, onConfirm, onCancel }: TemplateAssignConfirmModalProps) {
  const handleBackdropClick = () => {
    if (isSubmitting) {
      return;
    }
    onCancel();
  };

  const handlePanelClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const handleCloseClick = () => {
    if (isSubmitting) {
      return;
    }
    onCancel();
  };

  return (
    <div className="template-modal" role="dialog" aria-modal="true" onClick={handleBackdropClick}>
      <div className="template-modal-panel template-modal-panel--confirm" onClick={handlePanelClick}>
        <header className="template-modal-header">
          <div>
            <p className="template-modal-eyebrow">Confirm Assignment</p>
            <h2>{template.name}</h2>
          </div>
          <button
            type="button"
            className="template-modal-close"
            onClick={handleCloseClick}
            aria-label="Close confirmation"
          >
            <CloseRoundedIcon />
          </button>
        </header>

        <div className="template-modal-body template-modal-body--confirm">
          <p className="template-confirm-text">
            This template will be copied to your workspace with tenant-specific placeholders so you can
            update the actual branding details after assignment.
          </p>
          <ul className="template-confirm-list">
            <li>Includes dynamic fields for agency name, logo, and contact details.</li>
            <li>Assignment is instant and does not consume credits.</li>
            <li>You can personalize the design later from My Templates.</li>
          </ul>
        </div>

        <div className="ddModal-actions">
          <button
            type="button"
            className="ddModal-btn ddModal-btn--ghost"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="ddModal-btn ddModal-btn--primary"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Assigning..." : "Confirm & Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

type TemplateUnassignConfirmModalProps = {
  template: TemplateCardModel;
  isSubmitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

function TemplateUnassignConfirmModal({ template, isSubmitting, onConfirm, onCancel }: TemplateUnassignConfirmModalProps) {
  const handleBackdropClick = () => {
    if (isSubmitting) {
      return;
    }
    onCancel();
  };

  const handlePanelClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const handleCloseClick = () => {
    if (isSubmitting) {
      return;
    }
    onCancel();
  };

  return (
    <div className="template-modal" role="dialog" aria-modal="true" onClick={handleBackdropClick}>
      <div className="template-modal-panel template-modal-panel--confirm" onClick={handlePanelClick}>
        <header className="template-modal-header">
          <div>
            <p className="template-modal-eyebrow">Remove Template</p>
            <h2>{template.name}</h2>
          </div>
          <button
            type="button"
            className="template-modal-close"
            onClick={handleCloseClick}
            aria-label="Close unassign confirmation"
          >
            <CloseRoundedIcon />
          </button>
        </header>

        <div className="template-modal-body template-modal-body--confirm">
          <p className="template-confirm-text">
            This will remove the template from your workspace. You can reassign it later from the marketplace
            if needed.
          </p>
          <ul className="template-confirm-list">
            <li>Any custom edits you made in My Templates will be lost.</li>
            <li>No charges apply for unassigning a template.</li>
            <li>You can repurchase paid templates again when required.</li>
          </ul>
        </div>

        <div className="ddModal-actions">
          <button
            type="button"
            className="ddModal-btn ddModal-btn--ghost"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="ddModal-btn ddModal-btn--primary"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Removing..." : "Unassign Template"}
          </button>
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

const buildTenantPlaceholders = (tenant?: TenantProfile | null): PlaceholderMap => ({
  ...DEFAULT_PLACEHOLDERS,
  "{{agency_logo_url}}": tenant?.agencyLogo
    ? normalizeImageTokenValue(tenant.agencyLogo)
    : DEFAULT_PLACEHOLDERS["{{agency_logo_url}}"],
  "{{agency_name}}": tenant?.agencyName?.trim() || DEFAULT_PLACEHOLDERS["{{agency_name}}"],
  "{{contact_phone}}": tenant?.contactNo?.trim() || DEFAULT_PLACEHOLDERS["{{contact_phone}}"],
  "{{contact_address}}": tenant?.agencyAddress?.trim() || DEFAULT_PLACEHOLDERS["{{contact_address}}"],
});

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

const fillTemplatePlaceholders = (templateDesign: string, placeholders: PlaceholderMap) => {
  let result = templateDesign;
  Object.entries(placeholders).forEach(([placeholder, replacement]) => {
    result = result.replace(new RegExp(escapeRegExp(placeholder), "g"), replacement);
  });
  return result;
};

const finalizeTemplateDesign = (templateDesign: string, placeholders: PlaceholderMap) => {
  const filled = fillTemplatePlaceholders(templateDesign, placeholders);
  const parsed = parseDesign(filled);
  if (!parsed) {
    return filled;
  }
  return JSON.stringify(parsed);
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

type TemplateDesignRendererProps = {
  design: TemplateDesign;
  placeholders: PlaceholderMap;
};

function TemplateDesignRenderer({ design, placeholders }: TemplateDesignRendererProps) {
  const page = design.pages?.[0];
  if (!page) {
    return <pre className="template-modal-raw">No page definition found.</pre>;
  }

  const BASE_WIDTH = 595;
  const BASE_HEIGHT = 842;
  const TARGET_WIDTH = 720;
  const scale = Math.min(1, TARGET_WIDTH / BASE_WIDTH);
  const width = BASE_WIDTH * scale;
  const height = BASE_HEIGHT * scale;

  return (
    <div className="template-preview-canvas-wrapper">
      <div
        className="template-preview-canvas"
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
            placeholders={placeholders}
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
  placeholders: PlaceholderMap;
};

function TemplateDesignElementView({
  element,
  scale,
  canvasWidth,
  canvasHeight,
  baseWidth,
  baseHeight,
  placeholders,
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
    opacity: typeof element.opacity === "number" ? element.opacity : undefined,
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
        {resolvePlaceholders(textEl.content ?? "", placeholders)}
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
        src={resolveImageSource(imageEl.src, imageEl.fallback, placeholders)}
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
        <span className="design-pill-label">{pillEl.label}</span>
        <span className="design-pill-value">{resolvePlaceholders(pillEl.value ?? "", placeholders)}</span>
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

    if (shapeEl.shape === "circle") {
      const diameter = (shapeEl.width ?? shapeEl.height ?? 0) * scale;
      return (
        <div
          className="design-shape"
          style={{
            ...baseStyle,
            width: diameter,
            height: diameter,
            borderRadius: "50%",
            background: shapeEl.fill ?? "#f3f4f6",
            border: shapeEl.stroke ? `1px solid ${shapeEl.stroke}` : undefined,
            boxShadow: shapeEl.shadow,
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
          border: shapeEl.stroke ? `1px solid ${shapeEl.stroke}` : undefined,
        }}
      />
    );
  }

  return null;
}

const resolvePlaceholders = (value: string, placeholders: PlaceholderMap) => {
  let result = value;
  Object.entries(placeholders).forEach(([placeholder, sample]) => {
    result = result.replace(new RegExp(escapeRegExp(placeholder), "g"), sample);
  });
  return result;
};

const resolveImageSource = (src: string | undefined, fallback: string | undefined, placeholders: PlaceholderMap) => {
  if (!src) {
    return fallback ? resolvePlaceholders(fallback, placeholders) : placeholders["{{cover_image_url}}"];
  }
  if (src.startsWith("http") || src.startsWith("data:")) {
    return src;
  }
  return placeholders[src] ?? (fallback ? resolvePlaceholders(fallback, placeholders) : placeholders["{{cover_image_url}}"]);
};