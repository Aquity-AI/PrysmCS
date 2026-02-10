import React, { useState, useRef, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { METRIC_ICON_OPTIONS, type IconOption } from './metrics-management/iconConfig';

interface IconPickerDropdownProps {
  currentIcon: string;
  onSelectIcon: (iconName: string) => void;
  onClose: () => void;
  position?: 'left' | 'right';
  allowReset?: boolean;
  defaultIcon?: string;
}

export function IconPickerDropdown({
  currentIcon,
  onSelectIcon,
  onClose,
  position = 'left',
  allowReset = true,
  defaultIcon
}: IconPickerDropdownProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const filteredIcons = METRIC_ICON_OPTIONS.filter(icon =>
    icon.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectIcon = (iconName: string) => {
    onSelectIcon(iconName);
    onClose();
  };

  const handleReset = () => {
    if (defaultIcon) {
      onSelectIcon(defaultIcon);
      onClose();
    }
  };

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'absolute',
        top: '100%',
        [position]: '0',
        marginTop: '8px',
        width: '280px',
        maxHeight: '400px',
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <div style={{
        padding: '12px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <div style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Search size={14} style={{
            position: 'absolute',
            left: '8px',
            color: '#94a3b8'
          }} />
          <input
            type="text"
            placeholder="Search icons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              padding: '6px 8px 6px 28px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '13px',
              outline: 'none'
            }}
          />
        </div>
        <button
          onClick={onClose}
          style={{
            padding: '4px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <X size={14} />
        </button>
      </div>

      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '8px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '4px'
        }}>
          {filteredIcons.map((icon) => {
            const Icon = icon.component;
            const isSelected = icon.name === currentIcon;
            return (
              <button
                key={icon.name}
                onClick={() => handleSelectIcon(icon.name)}
                title={icon.name}
                style={{
                  padding: '10px',
                  background: isSelected ? '#f0f9ff' : 'white',
                  border: isSelected ? '2px solid #0ea5e9' : '1px solid #e2e8f0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }
                }}
              >
                <Icon size={18} style={{ color: icon.color }} />
              </button>
            );
          })}
        </div>

        {filteredIcons.length === 0 && (
          <div style={{
            padding: '24px',
            textAlign: 'center',
            color: '#94a3b8',
            fontSize: '13px'
          }}>
            No icons found matching "{searchTerm}"
          </div>
        )}
      </div>

      {allowReset && defaultIcon && currentIcon !== defaultIcon && (
        <div style={{
          padding: '8px',
          borderTop: '1px solid #e2e8f0'
        }}>
          <button
            onClick={handleReset}
            style={{
              width: '100%',
              padding: '6px 12px',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              color: '#64748b',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            Reset to Default
          </button>
        </div>
      )}
    </div>
  );
}
