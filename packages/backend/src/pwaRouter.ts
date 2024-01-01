import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import {
  ZTheme,
  THEME_DEFAULT,
  type Theme,
} from '@nihalgonsalves/expenses-shared/types/theme';
import type { User } from '@nihalgonsalves/expenses-shared/types/user';

import type { makeCreateContext } from './context';

/**
 * Server-side router that serves the manifest and dynamic icons for the PWA
 */

type ThemeColors = {
  primary: `hsl(${number} ${number}% ${number}%)`;
  background: `hsl(${number} ${number}% ${number}%)`;
};

// from the dark theme variants of tailwind.css

const themeColors: Record<Theme, ThemeColors> = {
  blue: {
    primary: 'hsl(221.2 83.2% 53.3%)',
    background: 'hsl(222.2 84% 4.9%)',
  },
  slate: { primary: 'hsl(210 40% 98%)', background: 'hsl(222.2 84% 4.9%)' },
  rose: { primary: 'hsl(346.8 77.2% 49.8%)', background: 'hsl(20 14.3% 4.1%)' },
  green: {
    primary: 'hsl(142.1 70.6% 45.3%)',
    background: 'hsl(20 14.3% 4.1%)',
  },
  orange: {
    primary: 'hsl(20.5 90.2% 48.2%)',
    background: 'hsl(20 14.3% 4.1%)',
  },
  yellow: {
    primary: 'hsl(47.9 95.8% 53.1%)',
    background: 'hsl(20 14.3% 4.1%)',
  },
  violet: {
    primary: 'hsl(263.4 70% 50.4%)',
    background: 'hsl(224 71.4% 4.1%)',
  },
};

const icon = ({ background, primary }: ThemeColors) => `
  <svg
    width="512"
    height="512"
    viewBox="0 0 512 512"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clip-path="url(#clip0_10_169)">
      <path d="M0 0H512V512H0V0Z" fill="${primary}" />
      <path
        d="M257.501 127C189.931 127 137 152.829 137 185.804V346.191C137 379.166 189.932 405 257.501 405C325.074 405 378.007 379.166 378.007 346.191V185.804C378.007 152.829 325.074 127 257.501 127ZM366.888 346.191C366.888 372.041 316.793 393.88 257.501 393.88C198.212 393.88 148.12 372.041 148.12 346.191V318.319C167.033 338.471 208.335 352.18 257.501 352.18C306.669 352.18 347.974 338.471 366.888 318.318V346.191ZM366.888 293.377C366.888 319.222 316.793 341.06 257.501 341.06C198.212 341.06 148.12 319.222 148.12 293.377V265.467C167.033 285.619 208.335 299.328 257.501 299.328C306.669 299.328 347.974 285.619 366.888 265.466V293.377ZM366.888 240.524C366.888 266.369 316.793 288.207 257.501 288.207C198.212 288.207 148.12 266.369 148.12 240.524V210.746C167.033 230.898 208.335 244.607 257.501 244.607C306.669 244.607 347.974 230.898 366.888 210.745V240.524ZM257.501 233.487C198.212 233.487 148.12 211.649 148.12 185.804C148.12 159.959 198.212 138.12 257.501 138.12C316.793 138.12 366.888 159.959 366.888 185.804C366.888 211.649 316.793 233.487 257.501 233.487Z"
        fill="${background}"
      />
      <path
        d="M-103 375.799C9.5 146.799 340.5 109.799 663 269.799V612.799H-103V375.799Z"
        fill="${background}"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M376.684 178.633C372.463 178.052 368.253 177.507 364.055 177C365.906 180.412 366.888 183.951 366.888 187.569C366.888 213.414 316.793 235.252 257.501 235.252C198.212 235.252 148.12 213.414 148.12 187.569C148.12 187.166 148.132 186.763 148.156 186.362C144.412 187.25 140.693 188.179 137 189.148V347.956C137 380.931 189.932 406.765 257.501 406.765C325.074 406.765 378.007 380.931 378.007 347.956V187.569C378.007 184.524 377.556 181.541 376.684 178.633ZM257.501 395.645C316.793 395.645 366.888 373.807 366.888 347.956V320.083C347.974 340.236 306.669 353.945 257.501 353.945C208.335 353.945 167.033 340.236 148.12 320.084V347.956C148.12 373.807 198.212 395.645 257.501 395.645ZM257.501 342.825C316.793 342.825 366.888 320.987 366.888 295.142V267.231C347.974 287.385 306.669 301.093 257.501 301.093C208.335 301.093 167.033 287.385 148.12 267.232V295.142C148.12 320.987 198.212 342.825 257.501 342.825ZM257.501 289.972C316.793 289.972 366.888 268.134 366.888 242.289V212.51C347.974 232.664 306.669 246.372 257.501 246.372C208.335 246.372 167.033 232.664 148.12 212.511V242.289C148.12 268.134 198.212 289.972 257.501 289.972Z"
        fill="${primary}"
      />
    </g>
    <defs>
      <clipPath id="clip0_10_169">
        <rect width="512" height="512" rx="90" fill="white" />
      </clipPath>
    </defs>
  </svg>
`;

const iconMaskable = ({ background, primary }: ThemeColors) => `
  <svg
    width="512"
    height="512"
    viewBox="0 0 512 512"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clip-path="url(#clip0_8_156)">
      <path d="M0 0H512V512H0V0Z" fill="${primary}" />
      <path
        d="M257.501 127C189.931 127 137 152.829 137 185.804V346.191C137 379.166 189.932 405 257.501 405C325.074 405 378.007 379.166 378.007 346.191V185.804C378.007 152.829 325.074 127 257.501 127ZM366.888 346.191C366.888 372.041 316.793 393.88 257.501 393.88C198.212 393.88 148.12 372.041 148.12 346.191V318.319C167.033 338.471 208.335 352.18 257.501 352.18C306.669 352.18 347.974 338.471 366.888 318.318V346.191ZM366.888 293.377C366.888 319.222 316.793 341.06 257.501 341.06C198.212 341.06 148.12 319.222 148.12 293.377V265.467C167.033 285.619 208.335 299.328 257.501 299.328C306.669 299.328 347.974 285.619 366.888 265.466V293.377ZM366.888 240.524C366.888 266.369 316.793 288.207 257.501 288.207C198.212 288.207 148.12 266.369 148.12 240.524V210.746C167.033 230.898 208.335 244.607 257.501 244.607C306.669 244.607 347.974 230.898 366.888 210.745V240.524ZM257.501 233.487C198.212 233.487 148.12 211.649 148.12 185.804C148.12 159.959 198.212 138.12 257.501 138.12C316.793 138.12 366.888 159.959 366.888 185.804C366.888 211.649 316.793 233.487 257.501 233.487Z"
        fill="${background}"
      />
      <path
        d="M-103 375.799C9.5 146.799 340.5 109.799 663 269.799V612.799H-103V375.799Z"
        fill="${background}"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M376.684 178.633C372.463 178.052 368.253 177.507 364.055 177C365.906 180.412 366.888 183.951 366.888 187.569C366.888 213.414 316.793 235.252 257.501 235.252C198.212 235.252 148.12 213.414 148.12 187.569C148.12 187.166 148.132 186.763 148.156 186.362C144.412 187.25 140.693 188.179 137 189.148V347.956C137 380.931 189.932 406.765 257.501 406.765C325.074 406.765 378.007 380.931 378.007 347.956V187.569C378.007 184.524 377.556 181.541 376.684 178.633ZM257.501 395.645C316.793 395.645 366.888 373.807 366.888 347.956V320.083C347.974 340.236 306.669 353.945 257.501 353.945C208.335 353.945 167.033 340.236 148.12 320.084V347.956C148.12 373.807 198.212 395.645 257.501 395.645ZM257.501 342.825C316.793 342.825 366.888 320.987 366.888 295.142V267.231C347.974 287.385 306.669 301.093 257.501 301.093C208.335 301.093 167.033 287.385 148.12 267.232V295.142C148.12 320.987 198.212 342.825 257.501 342.825ZM257.501 289.972C316.793 289.972 366.888 268.134 366.888 242.289V212.51C347.974 232.664 306.669 246.372 257.501 246.372C208.335 246.372 167.033 232.664 148.12 212.511V242.289C148.12 268.134 198.212 289.972 257.501 289.972Z"
        fill="${primary}"
      />
    </g>
    <defs>
      <clipPath id="clip0_8_156">
        <rect width="512" height="512" fill="white" />
      </clipPath>
    </defs>
  </svg>
`;

const getSettings = async (user: User | undefined) => {
  const theme = ZTheme.catch(THEME_DEFAULT).parse(user?.theme);

  return { ...themeColors[theme], theme };
};

export const makePWARouter =
  (createContext: ReturnType<typeof makeCreateContext>) =>
  async (fastify: FastifyInstance, _options: unknown) => {
    fastify.get('/manifest.webmanifest', async (request, reply) => {
      const context = await createContext({ req: request, res: reply });

      const { primary } = await getSettings(context.user);

      await reply.send({
        id: '/',
        name: 'Expenses',
        short_name: 'Expenses',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        lang: 'en',
        scope: '/',
        description: 'Expenses App',
        theme_color: primary,
        // prettier-ignore
        icons: [
          { src: `/api/icon.svg`,               type: 'image/svg+xml', sizes: '512x512'                        },
          { src: `/api/icon-maskable.svg`,      type: 'image/svg+xml', sizes: '512x512', purpose: 'maskable'   },
          { src: '/assets/icon-monochrome.svg', type: 'image/svg+xml', sizes: '16x16',   purpose: 'monochrome' },
        ],
      });
    });

    [
      { path: '/icon.svg', iconFn: icon },
      { path: '/icon-maskable.svg', iconFn: iconMaskable },
    ].forEach(({ path, iconFn }) => {
      fastify.get(path, async (request, reply) => {
        const context = await createContext({ req: request, res: reply });

        const { theme } = await getSettings(context.user);

        void reply.header('Content-Type', 'image/svg+xml');
        await reply.send(iconFn(themeColors[theme]));
      });
    });

    fastify.get('/icon-preview-:theme.svg', async (request, reply) => {
      const params = z.object({ theme: ZTheme }).safeParse(request.params);

      if (params.success) {
        void reply.header('Content-Type', 'image/svg+xml');
        await reply.send(icon(themeColors[params.data.theme]));
      } else {
        reply.callNotFound();
      }
    });
  };
