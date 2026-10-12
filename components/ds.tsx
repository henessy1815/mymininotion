'use client';

/**
 * Teamchat design-system components used by the mockup, ported from
 * _ds_bundle.js. Hover states moved from JS state to CSS (app/globals.css).
 * Icons: lucide (the DS loads lucide-static from a CDN; we use lucide-react).
 */

import Link from 'next/link';
import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { ChevronDown, Search, type LucideIcon } from 'lucide-react';

export function Avatar({
  size = 24,
  src,
  initials,
  bg = 'var(--bg-selected)',
}: {
  size?: number;
  src?: string | null;
  initials?: string;
  bg?: string;
}) {
  return (
    <span
      style={{
        width: size,
        height: size,
        flex: 'none',
        borderRadius: '50%',
        background: bg,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        lineHeight: 1,
        color: 'var(--text-on-color)',
        fontWeight: 600,
        fontSize: Math.round(size * 0.4),
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- data URLs from the user's upload
        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        initials
      )}
    </span>
  );
}

/** Loading placeholder with a shimmer sweep. The parent sets its size. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <span className={['skeleton', className].filter(Boolean).join(' ')} aria-hidden="true" />;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
};

export function Button({ variant = 'primary', size = 'md', icon: Icon, className = '', children, ...rest }: ButtonProps) {
  const cls = ['btn', `btn-${variant}`, size !== 'md' && `btn-${size}`, Icon && 'has-icon', className]
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" className={cls} {...rest}>
      {Icon && <Icon size={size === 'sm' ? 14 : 18} />}
      {children}
    </button>
  );
}

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon: LucideIcon;
  label: string;
  size?: number;
  iconSize?: number;
  active?: boolean;
};

export function IconButton({ icon: Icon, label, size = 32, iconSize, active, className = '', style, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`icon-btn${active ? ' is-active' : ''} ${className}`}
      style={{ width: size, height: size, ...style }}
      {...rest}
    >
      <Icon size={iconSize ?? Math.round(size * 0.56)} />
    </button>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="kbd">{children}</kbd>;
}

export function SearchPill({ label = '검색', onClick }: { label?: string; onClick?: () => void }) {
  return (
    <button type="button" className="search-pill" onClick={onClick}>
      <Search size={15} />
      {label}
    </button>
  );
}

export function SidebarItem({
  href,
  icon: Icon,
  label,
  selected,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  selected?: boolean;
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      className={`sb-item${selected ? ' is-selected' : ''}`}
      aria-current={selected ? 'page' : undefined}
    >
      <span className="sb-item-icon">
        <Icon size={18} />
      </span>
      <span className="sb-item-label">{label}</span>
    </Link>
  );
}

export function SidebarSection({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="sb-section">
      <div className="sb-section-head">
        <button
          type="button"
          className={`sb-section-toggle${open ? '' : ' is-closed'}`}
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          {title}
          <ChevronDown size={14} />
        </button>
      </div>
      {open && children}
    </div>
  );
}

/** Sidebar row with an on/off switch (`role="switch"`). Same height and hover as SidebarItem. */
export function SidebarSwitch({
  icon: Icon,
  label,
  checked,
  onChange,
}: {
  icon: LucideIcon;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      title={label}
      aria-label={label}
      className="sb-item sb-switch"
      onClick={() => onChange(!checked)}
    >
      <span className="sb-item-icon">
        <Icon size={18} />
      </span>
      <span className="sb-item-label">{label}</span>
      <span className="switch" aria-hidden="true" />
    </button>
  );
}
