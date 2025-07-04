import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import contentstackService from '../services/contentstackService';
import './HeaderNavigation.css';

interface NavigationItem {
  label: string;
  link_type: string;
  url: string;
  icon?: string;
  description?: string;
  external_link: boolean;
  is_featured: boolean;
  order: number;
  is_active: boolean;
  sub_items?: SubNavigationItem[];
}

interface SubNavigationItem {
  sub_label: string;
  sub_url: string;
  sub_icon?: string;
  sub_description?: string;
}

interface NavigationMenu {
  title: string;
  menu_type: string;
  navigation_items: NavigationItem[];
}

const HeaderNavigation: React.FC = () => {
  const [navigationMenu, setNavigationMenu] = useState<NavigationMenu | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const location = useLocation();

  useEffect(() => {
    const fetchNavigation = async () => {
      try {
        setLoading(true);
        const menu = await contentstackService.getNavigationMenuByType('header');
        setNavigationMenu(menu);
      } catch (error) {
        console.error('Error fetching header navigation:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNavigation();
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    setActiveDropdown(null);
  };

  const toggleDropdown = (index: number) => {
    setActiveDropdown(activeDropdown === index ? null : index);
  };

  const isActiveLink = (url: string) => {
    if (url === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(url);
  };

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  };

  if (loading || !navigationMenu) {
    return (
      <header className="header-navigation loading">
        <div className="nav-container">
          <div className="nav-brand">
            <Link to="/">Mobile Compare</Link>
          </div>
        </div>
      </header>
    );
  }

  const activeItems = navigationMenu?.navigation_items
    ? navigationMenu.navigation_items
        .filter(item => item && item.is_active)
        .sort((a, b) => (a?.order || 0) - (b?.order || 0))
    : [];

  return (
    <header className="header-navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/" onClick={handleLinkClick}>
            <span className="brand-icon">📱</span>
            <span className="brand-text">Mobile Compare</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="nav-desktop">
          <ul className="nav-list">
            {activeItems.map((item, index) => (
              <li key={index} className="nav-item">
                {item.sub_items && Array.isArray(item.sub_items) && item.sub_items.length > 0 ? (
                  <div className="nav-dropdown">
                    <button
                      className={`nav-link dropdown-toggle ${item.is_featured ? 'featured' : ''}`}
                      onClick={() => toggleDropdown(index)}
                      aria-expanded={activeDropdown === index}
                    >
                      {item.icon && <span className="nav-icon">{item.icon}</span>}
                      {item.label}
                      <span className="dropdown-arrow">▼</span>
                    </button>
                    {activeDropdown === index && (
                      <div className="dropdown-menu">
                        <Link
                          to={item.url}
                          className="dropdown-item main-link"
                          onClick={() => setActiveDropdown(null)}
                        >
                          <span className="dropdown-icon">{item.icon}</span>
                          <div>
                            <div className="dropdown-label">All {item.label}</div>
                            <div className="dropdown-desc">{item.description}</div>
                          </div>
                        </Link>
                        {item.sub_items?.map((subItem, subIndex) => {
                          if (!subItem) return null;
                          return (
                          <Link
                            key={subIndex}
                            to={subItem.sub_url}
                            className="dropdown-item"
                            onClick={() => setActiveDropdown(null)}
                          >
                            <span className="dropdown-icon">{subItem.sub_icon}</span>
                            <div>
                              <div className="dropdown-label">{subItem.sub_label}</div>
                              <div className="dropdown-desc">{subItem.sub_description}</div>
                            </div>
                          </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : item.external_link ? (
                  <a
                    href={item.url}
                    className={`nav-link ${item.is_featured ? 'featured' : ''} ${isActiveLink(item.url) ? 'active' : ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.icon && <span className="nav-icon">{item.icon}</span>}
                    {item.label}
                  </a>
                ) : (
                  <Link
                    to={item.url}
                    className={`nav-link ${item.is_featured ? 'featured' : ''} ${isActiveLink(item.url) ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    {item.icon && <span className="nav-icon">{item.icon}</span>}
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile Menu Toggle */}
        <button
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="nav-mobile">
          <ul className="mobile-nav-list">
            {activeItems.map((item, index) => (
              <li key={index} className="mobile-nav-item">
                {item.external_link ? (
                  <a
                    href={item.url}
                    className={`mobile-nav-link ${item.is_featured ? 'featured' : ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleLinkClick}
                  >
                    {item.icon && <span className="nav-icon">{item.icon}</span>}
                    {item.label}
                  </a>
                ) : (
                  <Link
                    to={item.url}
                    className={`mobile-nav-link ${item.is_featured ? 'featured' : ''} ${isActiveLink(item.url) ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    {item.icon && <span className="nav-icon">{item.icon}</span>}
                    {item.label}
                  </Link>
                )}
                {item.sub_items && Array.isArray(item.sub_items) && item.sub_items.length > 0 && (
                  <ul className="mobile-sub-list">
                    {item.sub_items.map((subItem, subIndex) => {
                      if (!subItem) return null;
                      return (
                        <li key={subIndex} className="mobile-sub-item">
                          <Link
                            to={subItem.sub_url || '#'}
                            className="mobile-sub-link"
                            onClick={handleLinkClick}
                          >
                            {subItem.sub_icon && <span className="nav-icon">{subItem.sub_icon}</span>}
                            {subItem.sub_label || 'Unnamed Item'}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
};

export default HeaderNavigation;