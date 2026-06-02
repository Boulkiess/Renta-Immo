// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { darkTheme } from '../../theme/themes.js';
import { Menu, MenuItem } from './Menu.jsx';

const renderMenu = ui => render(<ThemeProvider theme={darkTheme}>{ui}</ThemeProvider>);

describe('Menu (jsdom)', () => {
  it('clicking the trigger opens then closes the menu', () => {
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

  it('a click outside closes the menu', () => {
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

  it('clicking an item triggers the handler then closes the menu', () => {
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

  it('a disabled item does not trigger its handler', () => {
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
    // menu stays open (the disabled item did not close it)
    expect(screen.getByText('Coller')).toBeInTheDocument();
  });
});
