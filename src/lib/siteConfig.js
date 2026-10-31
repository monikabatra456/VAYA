// src/lib/siteConfig.js
// Centralized contact, social, and founder configuration for VAYA

export const siteConfig = {
  name: 'VAYA',
  logo: '/assets/vaya-logo-500.webp',
  tagline: 'Your next adventure starts with VAYA. Know Before You Go!',
  socialLinks: [
    {
      name: 'WhatsApp Community',
      url: 'https://chat.whatsapp.com/BaBmwyGOnOhGKWXreFZxfQ',
      ariaLabel: 'Join VAYA WhatsApp Community',
      icon: 'whatsapp',
    },
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/company/govaya/',
      ariaLabel: 'Visit VAYA on LinkedIn',
      icon: 'linkedin',
    },
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/go.vaya/',
      ariaLabel: 'Follow VAYA on Instagram',
      icon: 'instagram',
    },
  ],
  founders: [
    {
      name: 'Monika Batra',
      role: 'Co-founder',
      email: 'MONIKA_EMAIL',
    },
    {
      name: 'Simardeep Kaur',
      role: 'Co-founder',
      email: 'SIMARDEEP_EMAIL',
    },
  ],
  madeWithLove: 'Made with love by Monika Batra',
  copyright: '© 2026 VAYA. All rights reserved.',
};

export default siteConfig;
