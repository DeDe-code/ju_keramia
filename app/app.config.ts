export default defineAppConfig({
  ui: {
    // Icon configuration to prevent hydration mismatches
    icons: {
      // Default icons used throughout the app - properly configured for SSR
      dark: 'i-heroicons-moon',
      light: 'i-heroicons-sun',
      search: 'i-heroicons-magnifying-glass',
      external: 'i-heroicons-arrow-top-right-on-square',
      chevronDown: 'i-heroicons-chevron-down',
      chevronLeft: 'i-heroicons-chevron-left',
      chevronRight: 'i-heroicons-chevron-right',
      chevronUp: 'i-heroicons-chevron-up',
      chevronDoubleLeft: 'i-heroicons-chevron-double-left',
      chevronDoubleRight: 'i-heroicons-chevron-double-right',
      menu: 'i-heroicons-bars-3',
      close: 'i-heroicons-x-mark',
      check: 'i-heroicons-check',
      plus: 'i-heroicons-plus',
      minus: 'i-heroicons-minus',
      loading: 'i-heroicons-arrow-path',
      camera: 'i-heroicons-camera',
      // Add other icons used in the app
      arrowLeft: 'i-heroicons-arrow-left',
      arrowRight: 'i-heroicons-arrow-right',
    },

    // Map your ceramic colors to Nuxt UI color system
    colors: {
      primary: 'clay', // Earth brown as primary
      secondary: 'sage', // Natural green as secondary
      success: 'sage', // Use sage for success states
      info: 'stone', // Stone for info states
      warning: 'clay', // Clay for warnings
      error: 'clay', // Dark clay for errors
      neutral: 'stone', // Stone as neutral
    },

    // Navigation menu with ceramic design
    navigationMenu: {
      slots: {
        root: 'bg-transparent',
        link: '!text-stone-950 font-ceramic-sans px-ceramic-xs py-ceramic-sm hover:!text-clay-800 transition-all duration-200',
      },
    },

    // Override button component with ceramic design
    button: {
      slots: {
        // Base ceramic styling applied to ALL UButtons
        base: [
          // Typography & Spacing
          'font-ceramic-sans transition-all duration-200 ease-in-out',
          // Focus & Accessibility
          // 'focus:ring-2 focus:ring-offset-2 focus:outline-none',
          // Hover
          ' cursor-pointer',
          // States
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          // Layout
          'inline-flex items-center justify-center gap-ceramic-xs',
        ].join(' '),
      },

      // Ceramic color variants
      color: {
        // Primary - Clay (earth browns)
        primary: {
          solid:
            'bg-clay-600 hover:bg-clay-700 active:bg-clay-800 text-cream-25 shadow-sm hover:shadow-md focus:ring-clay-500',
          outline:
            'border-2 border-clay-600 text-clay-600 hover:bg-clay-50 active:bg-clay-100 focus:ring-clay-500',
          soft: 'bg-clay-50 text-clay-700 hover:bg-clay-100 active:bg-clay-200 focus:ring-clay-500',
          ghost: 'text-clay-600 hover:bg-clay-50 active:bg-clay-100 focus:ring-clay-500',
        },
        // Secondary - Sage (natural greens)
        secondary: {
          solid:
            'bg-sage-600 hover:bg-sage-700 active:bg-sage-800 text-cream-25 shadow-sm hover:shadow-md focus:ring-sage-500',
          outline:
            'border-2 border-sage-600 text-sage-600 hover:bg-sage-50 active:bg-sage-100 focus:ring-sage-500',
          soft: 'bg-sage-50 text-sage-700 hover:bg-sage-100 active:bg-sage-200 focus:ring-sage-500',
          ghost: 'text-sage-600 hover:bg-sage-50 active:bg-sage-100 focus:ring-sage-500',
        },

        // Neutral - Stone (cool grays)
        neutral: {
          solid:
            'bg-stone-600 hover:bg-stone-700 active:bg-stone-800 text-cream-25 shadow-sm hover:shadow-md focus:ring-stone-500',
          outline:
            'border-2 border-stone-600 text-stone-600 hover:bg-stone-50 active:bg-stone-100 focus:ring-stone-500',
          soft: 'bg-stone-50 text-stone-700 hover:bg-stone-100 active:bg-stone-200 focus:ring-stone-500',
          ghost: 'text-stone-600 hover:bg-stone-50 active:bg-stone-100 focus:ring-stone-500',
        },

        // Special - Cream (warm backgrounds)
        cream: {
          solid:
            'bg-cream-100 hover:bg-cream-200 active:bg-cream-300 text-clay-800 border border-stone-200 focus:ring-clay-500',
          outline:
            'border-2 border-cream-200 text-clay-700 hover:bg-cream-25 active:bg-cream-50 focus:ring-clay-500',
          soft: 'bg-cream-25 text-clay-700 hover:bg-cream-50 active:bg-cream-100 focus:ring-clay-500',
          ghost: 'text-clay-700 hover:bg-cream-25 active:bg-cream-50 focus:ring-clay-500',
        },
      },

      // Ceramic sizing with proper touch targets
      size: {
        xs: 'text-ceramic-xs px-ceramic-xs py-ceramic-xs min-h-[2rem] min-w-[2rem]',
        sm: 'text-ceramic-sm px-ceramic-sm py-ceramic-sm min-h-[2.25rem] min-w-[2.25rem]',
        md: 'text-ceramic-base px-ceramic-md py-ceramic-md min-h-[2.5rem] min-w-[2.5rem]',
        lg: 'text-ceramic-lg px-ceramic-lg py-ceramic-lg min-h-[3rem] min-w-[3rem]',
        xl: 'text-ceramic-xl px-ceramic-xl py-ceramic-xl min-h-[3.5rem] min-w-[3.5rem]',
      },

      // Icon-specific sizing for buttons with icons
      icon: {
        xs: 'p-ceramic-xs !text-ceramic-sm',
        sm: 'p-ceramic-sm !text-ceramic-base',
        md: 'p-ceramic-md !text-ceramic-lg',
        lg: 'p-ceramic-lg !text-ceramic-xl',
        xl: 'p-ceramic-xl !text-ceramic-2xl',
      },

      // Default ceramic button configuration
      default: {
        color: 'primary',
        variant: 'solid',
        size: 'md',
      },
    },
    // Form Components
    formField: {
      slots: {
        root: 'my-ceramic-sm',
        error: '!text-ceramic-error font-ceramic-sans text-ceramic-sm mt-ceramic-xs',
      },
    },

    // Input components with ceramic styling
    input: {
      slots: {
        base: 'font-[var(--font-family-sans)] text-[var(--text-ceramic-base)] !bg-cream-50 border-stone-300 rounded-none focus:rounded-none focus-visible:rounded-none active:rounded-none hover:rounded-none ',
      },
      variants: {
        size: {
          xs: {
            base: 'text-[var(--text-ceramic-xs)] px-[var(--spacing-ceramic-xs)] py-[calc(var(--spacing-ceramic-xs)*0.75)] h-[var(--size-ceramic-xs)]',
          },
          sm: {
            base: 'text-[var(--text-ceramic-sm)] px-[var(--spacing-ceramic-sm)] py-[calc(var(--spacing-ceramic-sm)*0.75)] h-[var(--size-ceramic-sm)]',
          },
          md: {
            base: 'text-[var(--text-ceramic-base)] px-[var(--spacing-ceramic-md)] py-[calc(var(--spacing-ceramic-md)*0.75)] h-[var(--size-ceramic-md)]',
          },
          lg: {
            base: 'text-[var(--text-ceramic-lg)] px-[var(--spacing-ceramic-lg)] py-[calc(var(--spacing-ceramic-lg)*0.75)] h-[var(--size-ceramic-lg)]',
          },
        },
      },
      color: {
        error: 'border-ceramic-error focus:ring-ceramic-error',
      },
    },

    // Textarea components with ceramic styling
    textarea: {
      slots: {
        base: 'font-[var(--font-family-sans)] text-[var(--text-ceramic-base)] !bg-cream-50 border-stone-300 rounded-none focus:rounded-none focus-visible:rounded-none active:rounded-none hover:rounded-none focus:ring-0 focus-visible:ring-0',
      },
      variants: {
        size: {
          xs: {
            base: 'text-[var(--text-ceramic-xs)] px-[var(--spacing-ceramic-xs)] py-[calc(var(--spacing-ceramic-xs)*0.75)]',
          },
          sm: {
            base: 'text-[var(--text-ceramic-sm)] px-[var(--spacing-ceramic-sm)] py-[calc(var(--spacing-ceramic-sm)*0.75)]',
          },
          md: {
            base: 'text-[var(--text-ceramic-base)] px-[var(--spacing-ceramic-md)] py-[calc(var(--spacing-ceramic-md)*0.75)]',
          },
          lg: {
            base: 'text-[var(--text-ceramic-lg)] px-[var(--spacing-ceramic-lg)] py-[calc(var(--spacing-ceramic-lg)*0.75)]',
          },
        },
      },
    },

    // Card component with ceramic aesthetics
    card: {
      slots: {
        root: 'bg-cream-50 border border-stone-200 rounded-[var(--radius-ceramic-lg)] shadow-sm hover:shadow-md transition-shadow duration-200',
        header: 'p-[var(--spacing-ceramic-lg)] border-b border-stone-100',
        body: 'p-[var(--spacing-ceramic-lg)]',
        footer: 'p-[var(--spacing-ceramic-lg)] border-t border-stone-100 bg-cream-25',
      },
    },
  },
});
