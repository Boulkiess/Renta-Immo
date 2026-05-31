// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { darkTheme } from '../../theme/themes.js';
import { Menu, MenuItem } from './Menu.jsx';

const renderMenu = ui => render(<ThemeProvider theme={darkTheme}>{ui}</ThemeProvider>);

describe('Menu (jsdom)', () => {
  it('cliquer le trigger ouvre puis ferme le menu', () => {
    renderMenu(
      <Menu trigger={<span>⋮</span>} title="menu">
        <MenuItem onClick={() => {}}>Action</MenuItem>
      </Menu>
    );
    const trigger = screen.getByTitle('menu');
    expect(screen.queryByText('Action')).toBeNull();
    fireEvent.click(trigger);
    expect(screen.getByText('Action')).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.queryByText('Action')).toBeNull();
  });

  it('un clic à l’extérieur ferme le menu', () => {
    renderMenu(
      <Menu trigger={<span>⋮</span>} title="menu">
        <MenuItem onClick={() => {}}>Action</MenuItem>
      </Menu>
    );
    fireEvent.click(screen.getByTitle('menu'));
    expect(screen.getByText('Action')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Action')).toBeNull();
  });

  it('cliquer un item déclenche le handler puis ferme le menu', () => {
    const onClick = vi.fn();
    renderMenu(
      <Menu trigger={<span>⋮</span>} title="menu">
        <MenuItem onClick={onClick}>Action</MenuItem>
      </Menu>
    );
    fireEvent.click(screen.getByTitle('menu'));
    fireEvent.click(screen.getByText('Action'));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Action')).toBeNull();
  });

  it('un item désactivé ne déclenche pas son handler', () => {
    const onClick = vi.fn();
    renderMenu(
      <Menu trigger={<span>⋮</span>} title="menu">
        <MenuItem onClick={onClick} disabled>
          Coller
        </MenuItem>
      </Menu>
    );
    fireEvent.click(screen.getByTitle('menu'));
    fireEvent.click(screen.getByText('Coller'));
    expect(onClick).not.toHaveBeenCalled();
    // menu reste ouvert (l'item disabled n'a pas fermé)
    expect(screen.getByText('Coller')).toBeInTheDocument();
  });
});
