// @vitest-environment jsdom

import { Outlet, useParams } from 'react-router-dom';
import './setup';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FileRouterProvider } from '../src/FileRouterProvider';
import { createTypedRouter } from '../src/typed';
import { JSX } from 'react/jsx-runtime';

const page = (render: () => JSX.Element) => ({
  path: '',
  import: async () => ({ default: render }),
});

const User = () => <h1>user {useParams().id}</h1>;

const routes = {
  index: page(() => <h1>home</h1>),
  about: page(() => <h1>about</h1>),
  users: {
    _layout: page(() => (
      <section aria-label="users-layout">
        <Outlet />
      </section>
    )),
    index: page(() => <h1>users list</h1>),
    $id: page(User),
  },
  files: { $: page(() => <h1>files splat</h1>) },
  broken: page(() => {
    throw new Error('boom');
  }),
};

const { Link, useNavigate } = createTypedRouter<typeof routes>();

const renderAt = (url: string, props = {}) =>
  render(
    <FileRouterProvider
      routes={routes}
      mode="memory"
      initialEntries={[url]}
      fallback={<span>loading</span>}
      {...props}
    />,
  );

describe('FileRouterProvider rendering', () => {
  it('shows the fallback and then the lazy page', async () => {
    renderAt('/about');

    expect(screen.getByText('loading')).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'about' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('loading')).not.toBeInTheDocument();
  });

  it('renders index routes', async () => {
    renderAt('/');

    expect(
      await screen.findByRole('heading', { name: 'home' }),
    ).toBeInTheDocument();
  });

  it('renders directory index inside the _layout', async () => {
    renderAt('/users');

    const layout = await screen.findByLabelText('users-layout');

    expect(layout).toContainElement(
      screen.getByRole('heading', { name: 'users list' }),
    );
  });

  it('passes dynamic params to the page', async () => {
    renderAt('/users/42');

    expect(
      await screen.findByRole('heading', { name: 'user 42' }),
    ).toBeInTheDocument();
  });

  it('matches splat routes', async () => {
    renderAt('/files/a/b/c');

    expect(
      await screen.findByRole('heading', { name: 'files splat' }),
    ).toBeInTheDocument();
  });

  it('renders notFound for unknown urls', async () => {
    renderAt('/nope', { notFound: <p>404</p> });

    expect(await screen.findByText('404')).toBeInTheDocument();
  });

  it('renders errorElement when a page throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderAt('/broken', { errorElement: <p>oops</p> });

    expect(await screen.findByText('oops')).toBeInTheDocument();
  });

  it('honors basename', async () => {
    renderAt('/app/about', { basename: '/app' });

    expect(
      await screen.findByRole('heading', { name: 'about' }),
    ).toBeInTheDocument();
  });
});

describe('typed navigation', () => {
  const Nav = () => {
    const navigate = useNavigate();

    return (
      <>
        <Link to="/users/:id" params={{ id: 7 }}>
          go user
        </Link>
        <button onClick={() => navigate('/about')}>go about</button>
      </>
    );
  };

  const withNav = {
    ...routes,
    index: page(() => <Nav />),
  };

  it('Link renders a real anchor with the filled href and navigates', async () => {
    render(
      <FileRouterProvider
        routes={withNav}
        mode="memory"
        initialEntries={['/']}
      />,
    );

    const link = await screen.findByRole('link', { name: 'go user' });

    expect(link).toHaveAttribute('href', '/users/7');

    await userEvent.click(link);

    expect(
      await screen.findByRole('heading', { name: 'user 7' }),
    ).toBeInTheDocument();
  });

  it('useNavigate navigates programmatically', async () => {
    render(
      <FileRouterProvider
        routes={withNav}
        mode="memory"
        initialEntries={['/']}
      />,
    );

    await userEvent.click(
      await screen.findByRole('button', { name: 'go about' }),
    );

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'about' }),
      ).toBeInTheDocument(),
    );
  });
});
