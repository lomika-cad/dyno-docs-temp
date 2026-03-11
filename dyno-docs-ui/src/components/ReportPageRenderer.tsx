import React from 'react';

export const A4_WIDTH = 595;
export const A4_HEIGHT = 842;

const HEADER_HEIGHT = 130;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 32;
const CONTENT_HEIGHT = A4_HEIGHT - HEADER_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

export type ReportPageType = 'template' | 'customerInfo' | 'dayDetail' | 'dayDetailContinued' | 'cost' | 'policies';

export interface ReportPage {
    type: ReportPageType;
    pageNumber: number;
    dayNumber?: number;
    content: any;
    isOverflow?: boolean;
    overflowContent?: any;
}

export interface ReportData {
    version?: string;
    metadata?: {
        customerName?: string;
        customerEmail?: string;
        country?: string;
        mobileNo?: string;
        transportationMode?: string;
        numberOfPassengers?: string;
        daysAndNights?: string;
        selectedRoutes?: string[];
        createdAt?: string;
        bookingGradientColor?: string;
        dayHeaderColor?: string;
        dayItineraryColor?: string;
        dayPlacesColor?: string;
        dayServicesColor?: string;
        dayNotesColor?: string;
        costHeaderColor?: string;
        costTotalColor?: string;
        policiesHeaderColor?: string;
        textColor?: string;
    };
    cost?: {
        totalAmount?: number;
        promoCode?: string;
        promoCodeDiscount?: number;
        finalAmount?: number;
    };
    policies?: {
        specialRemark?: string;
        bookingPolicy?: string;
        cancellationPolicy?: string;
    };
    template?: {
        id?: string;
        name?: string;
        thumbnail?: string;
    };
    templateDesign?: any;
    pages?: ReportPage[];
    totalPages?: number;
}

export const getImgSrc = (raw: any): string => {
    console.log(raw);    
    const s = typeof raw === 'string' ? raw : '';
    if (!s) return '';
    if (s.startsWith('data:')) return s;
    if (s.length > 200 && /^[A-Za-z0-9+/]+=*$/.test(s)) return `data:image/jpeg;base64,${s}`;
    return s;
};

export const placeImgs = (place: any): string[] => {
    const urls: string[] = [];
    let idx = 1;
    while (place[`image${idx}Url`]) { urls.push(getImgSrc(place[`image${idx}Url`])); idx++; }
    if (urls.length === 0) {
        const fb = place.images ?? place.Images ?? place.image ?? place.Image;
        if (fb) (Array.isArray(fb) ? fb : [fb]).forEach((u: any) => urls.push(getImgSrc(u)));
    }
    return urls.filter(Boolean);
};

export const svcImgs = (hotel: any): string[] => {
    const raw = hotel.images ?? hotel.Images ?? hotel.image ?? hotel.Image ?? [];
    return (Array.isArray(raw) ? raw : [raw]).map(getImgSrc).filter(Boolean);
};

export const svcColors: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    hotel: { bg: '#f5f0ff', border: '#ddd6fe', text: '#5b21b6', badge: '#7c3aed' },
    transport: { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', badge: '#2563eb' },
    activity: { bg: '#fff1f0', border: '#fecaca', text: '#b91c1c', badge: '#dc2626' },
};

interface PageShellProps {
    children: React.ReactNode;
    scale?: number;
    showShadow?: boolean;
}

export const PageShell: React.FC<PageShellProps> = ({ children, scale = 1, showShadow = true }) => (
    <div style={{
        width: `${A4_WIDTH * scale}px`,
        height: `${A4_HEIGHT * scale}px`,
        background: '#FFFFFF',
        boxShadow: showShadow ? '0 16px 48px rgba(0,0,0,0.2)' : 'none',
        fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: '4px',
        flexShrink: 0,
        position: 'relative',
    }}>
        {children}
    </div>
);

interface SectionTitleProps {
    color: string;
    children: React.ReactNode;
    scale?: number;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ color, children, scale = 1 }) => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: `${8 * scale}px`,
        marginBottom: `${10 * scale}px`,
    }}>
        <div style={{ width: `${3 * scale}px`, height: `${16 * scale}px`, background: color, borderRadius: '2px', flexShrink: 0 }} />
        <div style={{ fontSize: `${10 * scale}px`, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{children}</div>
    </div>
);

interface TemplatePageProps {
    page: ReportPage;
    scale?: number;
}

export const TemplatePageRenderer: React.FC<TemplatePageProps> = ({ page, scale = 1 }) => {
    return (
        <PageShell scale={scale}>
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                {page.content?.elements?.map((el: any, i: number) => {
                    const baseStyle: React.CSSProperties = {
                        position: 'absolute',
                        left: `${(el.x ?? 0) * scale}px`,
                        top: `${(el.y ?? 0) * scale}px`,
                    };

                    if (el.type === 'text') {
                        return (
                            <div key={i} style={{
                                ...baseStyle,
                                width: el.width ? `${el.width * scale}px` : 'auto',
                                fontSize: `${(el.fontSize ?? 14) * scale}px`,
                                fontFamily: el.fontFamily ?? 'Arial',
                                fontWeight: el.fontWeight ?? 400,
                                color: el.color ?? '#000',
                                lineHeight: el.lineHeight ?? 1.4,
                                letterSpacing: el.letterSpacing ? `${el.letterSpacing * scale}px` : undefined,
                            }}>
                                {el.content}
                            </div>
                        );
                    }
                    if (el.type === 'shape') {
                        if (el.shape === 'rectangle') {
                            return (
                                <div key={i} style={{
                                    ...baseStyle,
                                    width: `${(el.width ?? 100) * scale}px`,
                                    height: `${(el.height ?? 100) * scale}px`,
                                    background: el.fill ?? 'transparent',
                                    borderRadius: `${(el.borderRadius ?? 0) * scale}px`,
                                    border: el.stroke ? `1px solid ${el.stroke}` : undefined,
                                    boxShadow: el.shadow,
                                }} />
                            );
                        }
                        if (el.shape === 'circle') {
                            const diameter = (el.width ?? el.height ?? 0) * scale;
                            return (
                                <div key={i} style={{
                                    ...baseStyle,
                                    width: `${diameter}px`,
                                    height: `${diameter}px`,
                                    borderRadius: '50%',
                                    background: el.fill ?? '#f3f4f6',
                                    border: el.stroke ? `1px solid ${el.stroke}` : undefined,
                                    boxShadow: el.shadow,
                                }} />
                            );
                        }
                        if (el.shape === 'polygon' && el.points?.length) {
                            const polygonPoints = el.points
                                .map((point: { x: number; y: number }) => {
                                    const px = (point.x / A4_WIDTH) * 100;
                                    const py = (point.y / A4_HEIGHT) * 100;
                                    return `${px}% ${py}%`;
                                })
                                .join(', ');
                            return (
                                <div key={i} style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    width: `${A4_WIDTH * scale}px`,
                                    height: `${A4_HEIGHT * scale}px`,
                                    background: el.fill ?? '#111827',
                                    clipPath: `polygon(${polygonPoints})`,
                                }} />
                            );
                        }
                        if (el.shape === 'line') {
                            return (
                                <div key={i} style={{
                                    ...baseStyle,
                                    width: `${(el.width ?? 100) * scale}px`,
                                    height: `${Math.max(1, (el.height ?? 1) * scale)}px`,
                                    background: el.stroke ?? el.fill ?? '#e5e7eb',
                                    borderRadius: '999px',
                                }} />
                            );
                        }
                        return (
                            <div key={i} style={{
                                ...baseStyle,
                                width: `${(el.width ?? 100) * scale}px`,
                                height: `${(el.height ?? 100) * scale}px`,
                                background: el.fill ?? 'transparent',
                                borderRadius: `${(el.borderRadius ?? 0) * scale}px`,
                            }} />
                        );
                    }
                    if (el.type === 'image') {
                        return (
                            <img key={i} src={getImgSrc(el.src)} alt="" style={{
                                ...baseStyle,
                                width: `${(el.width ?? 100) * scale}px`,
                                height: `${(el.height ?? 100) * scale}px`,
                                objectFit: 'cover',
                                borderRadius: `${(el.borderRadius ?? 0) * scale}px`,
                            }} />
                        );
                    }
                    if (el.type === 'pill') {
                        return (
                            <div key={i} style={{
                                ...baseStyle,
                                padding: `${14 * scale}px ${18 * scale}px`,
                                borderRadius: `${18 * scale}px`,
                                background: el.colors?.bg ?? '#ffffff',
                                color: el.colors?.text ?? '#111827',
                                border: `1px solid ${(el.colors?.text ?? '#111827')}30`,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: `${4 * scale}px`,
                                minWidth: `${130 * scale}px`,
                                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
                            }}>
                                <span style={{ fontSize: `${10 * scale}px`, letterSpacing: '0.25em', textTransform: 'uppercase' }}>{el.label}</span>
                                <span style={{ fontSize: `${16 * scale}px`, fontWeight: 600 }}>{el.value}</span>
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
        </PageShell>
    );
};

interface CustomerInfoPageProps {
    page: ReportPage;
    reportData: ReportData;
    scale?: number;
}

export const CustomerInfoPageRenderer: React.FC<CustomerInfoPageProps> = ({ page, reportData, scale = 1 }) => {
    const metadata = reportData.metadata || page.content;
    const customerInitials = metadata?.customerName?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || 'N/A';
    const gradientColor = metadata?.bookingGradientColor || '#0284C7';
    const infoFields = [
        { icon: '👤', label: 'Full Name', value: metadata?.customerName },
        { icon: '🌍', label: 'Country', value: metadata?.country },
        { icon: '📱', label: 'Mobile', value: metadata?.mobileNo },
        { icon: '📧', label: 'Email', value: metadata?.customerEmail || page.content?.email },
        { icon: '🗓️', label: 'Duration', value: metadata?.daysAndNights },
        { icon: '👥', label: 'Passengers', value: metadata?.numberOfPassengers },
    ];

    return (
        <PageShell scale={scale}>
            <div style={{ height: `${170 * scale}px`, background: `linear-gradient(135deg, ${gradientColor} 0%, ${gradientColor}dd 100%)`, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: `${-30 * scale}px`, right: `${-30 * scale}px`, width: `${180 * scale}px`, height: `${180 * scale}px`, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                <div style={{ position: 'absolute', bottom: `${-40 * scale}px`, left: `${-40 * scale}px`, width: `${200 * scale}px`, height: `${200 * scale}px`, borderRadius: '50%', background: 'rgba(0,0,0,0.08)' }} />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                    <div style={{ width: `${60 * scale}px`, height: `${60 * scale}px`, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: `${24 * scale}px`, fontWeight: 700, color: gradientColor, margin: '0 auto', marginBottom: `${12 * scale}px`, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                        {customerInitials}
                    </div>
                    <div style={{ fontSize: `${20 * scale}px`, fontWeight: 700, color: 'white', marginBottom: `${4 * scale}px` }}>Booking Information</div>
                    <div style={{ fontSize: `${12 * scale}px`, color: 'rgba(255,255,255,0.8)' }}>Complete travel itinerary details</div>
                </div>
            </div>
            <div style={{ padding: `${32 * scale}px ${36 * scale}px`, flex: 1, overflow: 'hidden' }}>
                <SectionTitle color={gradientColor} scale={scale}>Customer Details</SectionTitle>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: `${16 * scale}px`, marginBottom: `${28 * scale}px` }}>
                    {infoFields.map((field, i) => (
                        <div key={i} style={{ padding: `${14 * scale}px`, background: '#F8FAFC', borderRadius: `${10 * scale}px`, border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: `${8 * scale}px`, marginBottom: `${6 * scale}px` }}>
                                <span style={{ fontSize: `${16 * scale}px` }}>{field.icon}</span>
                                <span style={{ fontSize: `${10 * scale}px`, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{field.label}</span>
                            </div>
                            <div style={{ fontSize: `${13 * scale}px`, fontWeight: 600, color: '#0F172A', paddingLeft: `${24 * scale}px` }}>{field.value || 'N/A'}</div>
                        </div>
                    ))}
                </div>
                <SectionTitle color="#10B981" scale={scale}>Selected Route</SectionTitle>
                <div style={{ background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', padding: `${16 * scale}px`, borderRadius: `${10 * scale}px`, border: '1px solid #A7F3D0', marginBottom: `${28 * scale}px` }}>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: `${8 * scale}px` }}>
                        {(metadata?.selectedRoutes || []).map((route: string, i: number) => (
                            <div key={i}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: `${6 * scale}px`, padding: `${6 * scale}px ${12 * scale}px`, background: 'white', borderRadius: `${6 * scale}px`, fontSize: `${12 * scale}px`, fontWeight: 600, color: '#047857', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                                    <span>📍</span>
                                    <span>{route}</span>
                                </div>
                                {i < (metadata?.selectedRoutes || []).length - 1 && (
                                    <span style={{ margin: `0 ${4 * scale}px`, color: '#10B981', fontSize: `${12 * scale}px` }}>→</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </PageShell>
    );
};

interface DayDetailPageProps {
    page: ReportPage;
    scale?: number;
}

export const splitDayContentForPages = (dayPage: ReportPage): ReportPage[] => {
    const content = dayPage.content;
    const places = content?.selectedPlaces || [];
    const hotels = content?.selectedHotels || [];
    
    const descriptionHeight = content?.description ? 100 : 0;
    const placesHeight = Math.ceil(places.length / 2) * 100;
    const hotelsHeight = hotels.length * 80;
    const remarksHeight = content?.remarks ? 60 : 0;
    const totalContentHeight = descriptionHeight + placesHeight + hotelsHeight + remarksHeight;
    
    if (totalContentHeight <= CONTENT_HEIGHT) {
        return [dayPage];
    }
    
    const pages: ReportPage[] = [];
    const maxPlacesPerPage = 4;
    const maxHotelsPerPage = 3;
    
    const firstPagePlaces = places.slice(0, maxPlacesPerPage);
    const firstPageHotels = hotels.slice(0, maxHotelsPerPage);
    const remainingPlaces = places.slice(maxPlacesPerPage);
    const remainingHotels = hotels.slice(maxHotelsPerPage);
    
    pages.push({
        ...dayPage,
        content: {
            ...content,
            selectedPlaces: firstPagePlaces,
            selectedHotels: firstPageHotels,
            remarks: remainingPlaces.length === 0 && remainingHotels.length === 0 ? content?.remarks : undefined,
        }
    });
    
    let currentPlaces = remainingPlaces;
    let currentHotels = remainingHotels;
    let pageCount = 1;
    
    while (currentPlaces.length > 0 || currentHotels.length > 0) {
        const pagePlaces = currentPlaces.slice(0, maxPlacesPerPage + 2);
        const pageHotels = currentHotels.slice(0, maxHotelsPerPage + 2);
        
        currentPlaces = currentPlaces.slice(maxPlacesPerPage + 2);
        currentHotels = currentHotels.slice(maxHotelsPerPage + 2);
        
        const isLast = currentPlaces.length === 0 && currentHotels.length === 0;
        
        pages.push({
            type: 'dayDetailContinued',
            pageNumber: dayPage.pageNumber + pageCount,
            dayNumber: dayPage.dayNumber,
            isOverflow: true,
            content: {
                selectedDay: content?.selectedDay,
                selectedPlaces: pagePlaces,
                selectedHotels: pageHotels,
                remarks: isLast ? content?.remarks : undefined,
            }
        });
        pageCount++;
    }
    
    return pages;
};

export const DayDetailPageRenderer: React.FC<DayDetailPageProps> = ({ page, scale = 1 }) => {
    const heroImgs: string[] = [];
    (page.content?.selectedPlaces || []).forEach((sp: any) => placeImgs(sp.place).slice(0, 2).forEach((u: string) => heroImgs.push(u)));

    const isContinuationPage = page.type === 'dayDetailContinued' || page.isOverflow;
    
    const dayHeaderColor = page.content?.dayHeaderColor || '#1E293B';
    const dayItineraryColor = page.content?.dayItineraryColor || '#8B5CF6';
    const dayPlacesColor = page.content?.dayPlacesColor || '#10B981';
    const dayServicesColor = page.content?.dayServicesColor || '#F59E0B';
    const dayNotesColor = page.content?.dayNotesColor || '#EC4899';
    const textColor = page.content?.textColor || '#374151';

    return (
        <PageShell scale={scale}>
            {!isContinuationPage && (
                <div style={{ height: `${130 * scale}px`, background: heroImgs.length > 0 ? 'transparent' : `linear-gradient(135deg, ${dayHeaderColor} 0%, ${dayHeaderColor}dd 100%)`, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                    {heroImgs.length > 0 ? (
                        <div style={{ display: 'flex', height: '100%' }}>
                            {heroImgs.slice(0, 4).map((src, i) => (
                                <div key={i} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)' }} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)' }} />
                    )}
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', zIndex: 10 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: `${56 * scale}px`, height: `${56 * scale}px`, borderRadius: '50%', background: 'rgba(255,255,255,0.95)', fontSize: `${20 * scale}px`, fontWeight: 700, color: dayHeaderColor, marginBottom: `${8 * scale}px`, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                            {page.dayNumber}
                        </div>
                        <div style={{ fontSize: `${15 * scale}px`, fontWeight: 700, color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{page.content?.selectedDay || 'Date TBD'}</div>
                    </div>
                </div>
            )}
            
            {isContinuationPage && (
                <div style={{ 
                    height: `${60 * scale}px`, 
                    background: `linear-gradient(135deg, ${dayHeaderColor} 0%, ${dayHeaderColor}dd 100%)`, 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: `0 ${32 * scale}px`,
                    flexShrink: 0 
                }}>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: `${12 * scale}px` 
                    }}>
                        <div style={{ 
                            width: `${36 * scale}px`, 
                            height: `${36 * scale}px`, 
                            borderRadius: '50%', 
                            background: 'rgba(255,255,255,0.15)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: `${14 * scale}px`,
                            fontWeight: 700,
                            color: 'white'
                        }}>
                            {page.dayNumber}
                        </div>
                        <div>
                            <div style={{ fontSize: `${13 * scale}px`, fontWeight: 700, color: 'white' }}>Day {page.dayNumber} (Continued)</div>
                            <div style={{ fontSize: `${10 * scale}px`, color: 'rgba(255,255,255,0.7)' }}>{page.content?.selectedDay || ''}</div>
                        </div>
                    </div>
                </div>
            )}
            
            <div style={{ 
                padding: `${20 * scale}px ${32 * scale}px ${32 * scale}px`, 
                flex: 1, 
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {page.content?.description && !isContinuationPage && (
                    <div style={{ marginBottom: `${20 * scale}px`, flexShrink: 0 }}>
                        <SectionTitle color={dayItineraryColor} scale={scale}>Daily Itinerary</SectionTitle>
                        <div style={{ fontSize: `${12 * scale}px`, lineHeight: 1.6, color: textColor, background: '#F9FAFB', padding: `${14 * scale}px`, borderRadius: `${8 * scale}px`, border: '1px solid #E5E7EB' }}>
                            {page.content.description}
                        </div>
                    </div>
                )}
                {(page.content?.selectedPlaces || []).length > 0 && (
                    <div style={{ marginBottom: `${20 * scale}px`, flexShrink: 0 }}>
                        <SectionTitle color={dayPlacesColor} scale={scale}>
                            {isContinuationPage ? 'More Visiting Places' : 'Visiting Places'}
                        </SectionTitle>
                        <div style={{ display: 'grid', gridTemplateColumns: `repeat(2, 1fr)`, gap: `${12 * scale}px` }}>
                            {(page.content.selectedPlaces || []).map((sp: any, i: number) => {
                                const imgs = placeImgs(sp.place);
                                return (
                                    <div key={i} style={{ background: 'white', borderRadius: `${10 * scale}px`, overflow: 'hidden', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                                        {imgs.length > 0 && (
                                            <div style={{ height: `${60 * scale}px`, overflow: 'hidden' }}>
                                                <img src={imgs[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                        )}
                                        <div style={{ padding: `${10 * scale}px` }}>
                                            <div style={{ fontSize: `${11 * scale}px`, fontWeight: 700, color: '#111827', marginBottom: `${3 * scale}px`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {sp.place?.name || sp.place?.placeName || 'Unknown'}
                                            </div>
                                            <div style={{ fontSize: `${9 * scale}px`, color: '#6B7280', display: 'flex', alignItems: 'center', gap: `${4 * scale}px` }}>
                                                <span>📍</span>
                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sp.district}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                {(page.content?.selectedHotels || []).length > 0 && (
                    <div style={{ marginBottom: `${20 * scale}px`, flexShrink: 0 }}>
                        <SectionTitle color={dayServicesColor} scale={scale}>
                            {isContinuationPage ? 'More Services' : 'Services & Accommodations'}
                        </SectionTitle>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: `${8 * scale}px` }}>
                            {(page.content.selectedHotels || []).map((sh: any, i: number) => {
                                const imgs = svcImgs(sh.hotel);
                                const theme = svcColors[sh.type] || svcColors.hotel;
                                return (
                                    <div key={i} style={{ display: 'flex', gap: `${10 * scale}px`, background: theme.bg, padding: `${10 * scale}px`, borderRadius: `${8 * scale}px`, border: `1px solid ${theme.border}` }}>
                                        {imgs[0] && (
                                            <img src={imgs[0]} alt="" style={{ width: `${60 * scale}px`, height: `${50 * scale}px`, borderRadius: `${6 * scale}px`, objectFit: 'cover', flexShrink: 0 }} />
                                        )}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: `${6 * scale}px`, marginBottom: `${4 * scale}px` }}>
                                                <div style={{ padding: `${2 * scale}px ${8 * scale}px`, borderRadius: `${4 * scale}px`, background: theme.badge, color: 'white', fontSize: `${8 * scale}px`, fontWeight: 700, textTransform: 'uppercase' }}>
                                                    {sh.type === 'hotel' ? '🏨 Hotel' : sh.type === 'transport' ? '🚗 Transport' : '🎯 Activity'}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: `${11 * scale}px`, fontWeight: 700, color: theme.text, marginBottom: `${2 * scale}px`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {sh.hotel?.name || sh.hotel?.serviceName || 'Service'}
                                            </div>
                                            <div style={{ fontSize: `${9 * scale}px`, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {sh.district}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                {page.content?.remarks && (
                    <div style={{ flexShrink: 0 }}>
                        <SectionTitle color={dayNotesColor} scale={scale}>Additional Notes</SectionTitle>
                        <div style={{ fontSize: `${10 * scale}px`, lineHeight: 1.5, color: '#6B7280', background: '#FDF2F8', padding: `${12 * scale}px`, borderRadius: `${8 * scale}px`, border: '1px solid #FBCFE8', fontStyle: 'italic' }}>
                            {page.content.remarks}
                        </div>
                    </div>
                )}
            </div>
        </PageShell>
    );
};

interface CostPageProps {
    page: ReportPage;
    reportData: ReportData;
    scale?: number;
}

export const CostPageRenderer: React.FC<CostPageProps> = ({ page, reportData, scale = 1 }) => {
    const costData = page.content || {};
    const reportCostData = reportData.cost || {};
    const totalAmount = costData.totalAmount || reportCostData.totalAmount || 0;
    const promoCode = costData.promoCode || reportCostData.promoCode || '';
    const promoCodeDiscount = costData.promoCodeDiscount || reportCostData.promoCodeDiscount || 0;
    const finalAmount = costData.finalAmount || reportCostData.finalAmount || totalAmount;
    
    const costHeaderColor = reportData.metadata?.costHeaderColor || page.content?.costHeaderColor || '#0f766e';
    const costTotalColor = reportData.metadata?.costTotalColor || page.content?.costTotalColor || '#15803d';
    const textColor = reportData.metadata?.textColor || page.content?.textColor || '#1e293b';

    return (
        <PageShell scale={scale}>
            <div style={{
                height: `${120 * scale}px`, flexShrink: 0, position: 'relative', overflow: 'hidden',
                background: `linear-gradient(135deg, ${costHeaderColor} 0%, ${costHeaderColor}dd 100%)`,
            }}>
                <div style={{ position: 'absolute', top: `${-30 * scale}px`, right: `${-30 * scale}px`, width: `${120 * scale}px`, height: `${120 * scale}px`, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ position: 'absolute', bottom: `${-20 * scale}px`, left: `${-20 * scale}px`, width: `${80 * scale}px`, height: `${80 * scale}px`, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                <div style={{ position: 'absolute', top: `${24 * scale}px`, left: `${36 * scale}px`, right: `${36 * scale}px` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: `${12 * scale}px`, marginBottom: `${8 * scale}px` }}>
                        <div style={{
                            width: `${40 * scale}px`, height: `${40 * scale}px`, borderRadius: '50%',
                            background: 'rgba(255,255,255,0.15)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontSize: `${18 * scale}px`
                        }}>💰</div>
                        <div>
                            <div style={{ color: 'white', fontSize: `${18 * scale}px`, fontWeight: 700, lineHeight: 1 }}>Cost Summary</div>
                            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: `${11 * scale}px`, marginTop: `${2 * scale}px` }}>
                                Package pricing & discounts
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ padding: `${32 * scale}px ${48 * scale}px`, flex: 1, background: '#fafafa' }}>
                <div style={{
                    background: 'white', borderRadius: `${16 * scale}px`, padding: `${28 * scale}px`,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9',
                    marginBottom: `${24 * scale}px`
                }}>
                    <div style={{ marginBottom: `${20 * scale}px` }}>
                        <div style={{ fontSize: `${14 * scale}px`, fontWeight: 700, color: textColor, marginBottom: `${16 * scale}px` }}>Package Details</div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${12 * scale}px 0`, borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ fontSize: `${13 * scale}px`, color: '#64748b' }}>Tour Package Amount</span>
                        <span style={{ fontSize: `${14 * scale}px`, fontWeight: 600, color: textColor }}>LKR {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>

                    {promoCodeDiscount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${12 * scale}px 0`, borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: `${8 * scale}px` }}>
                                <span style={{ fontSize: `${13 * scale}px`, color: '#64748b' }}>Promo Code Discount</span>
                                {promoCode && (
                                    <span style={{
                                        fontSize: `${10 * scale}px`, padding: `${2 * scale}px ${6 * scale}px`, borderRadius: `${4 * scale}px`,
                                        background: '#dcfce7', color: '#15803d', fontWeight: 600
                                    }}>
                                        {promoCode}
                                    </span>
                                )}
                            </div>
                            <span style={{ fontSize: `${14 * scale}px`, fontWeight: 600, color: '#dc2626' }}>-LKR {promoCodeDiscount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    )}

                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        marginTop: `${12 * scale}px`,
                        background: `linear-gradient(135deg, ${costTotalColor}15 0%, ${costTotalColor}20 100%)`,
                        margin: `${16 * scale}px ${-28 * scale}px ${-28 * scale}px`,
                        padding: `${20 * scale}px ${28 * scale}px`,
                        borderBottomLeftRadius: `${16 * scale}px`, borderBottomRightRadius: `${16 * scale}px`
                    }}>
                        <span style={{ fontSize: `${16 * scale}px`, fontWeight: 700, color: costTotalColor }}>Total Amount</span>
                        <span style={{ fontSize: `${20 * scale}px`, fontWeight: 700, color: costTotalColor }}>
                            LKR {finalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                <div style={{
                    background: 'white', borderRadius: `${12 * scale}px`, padding: `${20 * scale}px`,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9'
                }}>
                    <div style={{ fontSize: `${13 * scale}px`, fontWeight: 600, color: '#1e293b', marginBottom: `${12 * scale}px` }}>💳 Payment Information</div>
                    <div style={{ fontSize: `${12 * scale}px`, color: '#64748b', lineHeight: 1.6 }}>
                        • 40% advance payment required to confirm booking<br />
                        • Balance 60% due 30 days before tour commencement<br />
                        • All amounts are in Sri Lankan Rupees (LKR)
                    </div>
                </div>
            </div>
        </PageShell>
    );
};

interface PoliciesPageProps {
    page: ReportPage;
    reportData: ReportData;
    scale?: number;
}

export const PoliciesPageRenderer: React.FC<PoliciesPageProps> = ({ page, reportData, scale = 1 }) => {
    const policiesData = page.content || {};
    const reportPoliciesData = reportData.policies || {};
    const specialRemark = policiesData.specialRemark || reportPoliciesData.specialRemark || '';
    const bookingPolicy = policiesData.bookingPolicy || reportPoliciesData.bookingPolicy || '';
    const cancellationPolicy = policiesData.cancellationPolicy || reportPoliciesData.cancellationPolicy || '';
    
    const policiesHeaderColor = reportData.metadata?.policiesHeaderColor || page.content?.policiesHeaderColor || '#dc2626';
    const textColor = reportData.metadata?.textColor || page.content?.textColor || '#1e293b';

    return (
        <PageShell scale={scale}>
            <div style={{
                height: `${120 * scale}px`, flexShrink: 0, position: 'relative', overflow: 'hidden',
                background: `linear-gradient(135deg, ${policiesHeaderColor} 0%, ${policiesHeaderColor}dd 100%)`,
            }}>
                <div style={{ position: 'absolute', top: `${-30 * scale}px`, right: `${-30 * scale}px`, width: `${120 * scale}px`, height: `${120 * scale}px`, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ position: 'absolute', bottom: `${-20 * scale}px`, left: `${-20 * scale}px`, width: `${80 * scale}px`, height: `${80 * scale}px`, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                <div style={{ position: 'absolute', top: `${24 * scale}px`, left: `${36 * scale}px`, right: `${36 * scale}px` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: `${12 * scale}px`, marginBottom: `${8 * scale}px` }}>
                        <div style={{
                            width: `${40 * scale}px`, height: `${40 * scale}px`, borderRadius: '50%',
                            background: 'rgba(255,255,255,0.15)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontSize: `${18 * scale}px`
                        }}>📋</div>
                        <div>
                            <div style={{ color: 'white', fontSize: `${18 * scale}px`, fontWeight: 700, lineHeight: 1 }}>Terms & Policies</div>
                            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: `${11 * scale}px`, marginTop: `${2 * scale}px` }}>
                                Important information & conditions
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ padding: `${32 * scale}px ${48 * scale}px`, flex: 1, background: '#fafafa' }}>
                {specialRemark && (
                    <div style={{
                        background: 'white', borderRadius: `${12 * scale}px`, padding: `${20 * scale}px`,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9',
                        marginBottom: `${20 * scale}px`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: `${8 * scale}px`, marginBottom: `${12 * scale}px` }}>
                            <div style={{ fontSize: `${16 * scale}px` }}>⚡</div>
                            <div style={{ fontSize: `${14 * scale}px`, fontWeight: 700, color: textColor }}>Important Notice</div>
                        </div>
                        <div style={{ fontSize: `${12 * scale}px`, color: '#4b5563', lineHeight: 1.6, padding: `${12 * scale}px`, background: '#fef3c7', borderRadius: `${8 * scale}px`, border: '1px solid #fbbf24' }}>
                            {specialRemark}
                        </div>
                    </div>
                )}

                {bookingPolicy && (
                    <div style={{
                        background: 'white', borderRadius: `${12 * scale}px`, padding: `${20 * scale}px`,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9',
                        marginBottom: `${20 * scale}px`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: `${8 * scale}px`, marginBottom: `${12 * scale}px` }}>
                            <div style={{ fontSize: `${16 * scale}px` }}>📅</div>
                            <div style={{ fontSize: `${14 * scale}px`, fontWeight: 700, color: textColor }}>Booking Policy</div>
                        </div>
                        <div style={{ fontSize: `${12 * scale}px`, color: '#4b5563', lineHeight: 1.7 }}>
                            {bookingPolicy}
                        </div>
                    </div>
                )}

                {cancellationPolicy && (
                    <div style={{
                        background: 'white', borderRadius: `${12 * scale}px`, padding: `${20 * scale}px`,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: `${8 * scale}px`, marginBottom: `${12 * scale}px` }}>
                            <div style={{ fontSize: `${16 * scale}px` }}>❌</div>
                            <div style={{ fontSize: `${14 * scale}px`, fontWeight: 700, color: '#1e293b' }}>Cancellation Policy</div>
                        </div>
                        <div style={{ fontSize: `${12 * scale}px`, color: '#4b5563', lineHeight: 1.7 }}>
                            {cancellationPolicy}
                        </div>
                    </div>
                )}
            </div>
        </PageShell>
    );
};

interface ReportPageRendererProps {
    page: ReportPage;
    reportData: ReportData;
    scale?: number;
}

export const ReportPageRenderer: React.FC<ReportPageRendererProps> = ({ page, reportData, scale = 1 }) => {
    switch (page.type) {
        case 'template':
            return <TemplatePageRenderer page={page} scale={scale} />;
        case 'customerInfo':
            return <CustomerInfoPageRenderer page={page} reportData={reportData} scale={scale} />;
        case 'dayDetail':
        case 'dayDetailContinued':
            return <DayDetailPageRenderer page={page} scale={scale} />;
        case 'cost':
            return <CostPageRenderer page={page} reportData={reportData} scale={scale} />;
        case 'policies':
            return <PoliciesPageRenderer page={page} reportData={reportData} scale={scale} />;
        default:
            return null;
    }
};

export const processReportPagesForOverflow = (reportData: ReportData): ReportPage[] => {
    const pages = reportData.pages || [];
    const processedPages: ReportPage[] = [];
    
    pages.forEach((page) => {
        if (page.type === 'dayDetail') {
            const splitPages = splitDayContentForPages(page);
            processedPages.push(...splitPages);
        } else {
            processedPages.push(page);
        }
    });
    
    return processedPages.map((page, idx) => ({
        ...page,
        pageNumber: idx + 1
    }));
};

export default ReportPageRenderer;
