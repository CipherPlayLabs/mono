import React from 'react';
import {useThemeConfig} from '@docusaurus/theme-common';
import {useNavbarMobileSidebar} from '@docusaurus/theme-common/internal';
import NavbarItem from '@theme/NavbarItem';
import SearchBar from '@theme/SearchBar';

function useNavbarItems() {
  return useThemeConfig().navbar.items as Record<string, unknown>[];
}

export default function NavbarMobilePrimaryMenu(): React.JSX.Element {
  const mobileSidebar = useNavbarMobileSidebar();
  const items = useNavbarItems();

  return (
    <>
      <div className="navbar-sidebar__search">
        <SearchBar />
      </div>
      <ul className="menu__list">
        {items.map((item, i) => (
          <NavbarItem
            mobile
            {...item}
            onClick={() => mobileSidebar.toggle()}
            key={i}
          />
        ))}
      </ul>
    </>
  );
}
