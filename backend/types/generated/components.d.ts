import type { Schema, Struct } from '@strapi/strapi';

export interface SharedLegal extends Struct.ComponentSchema {
  collectionName: 'components_shared_legals';
  info: {
    description: 'Texte fuer Impressum, Datenschutz und AGB';
    displayName: 'Rechtliches';
  };
  attributes: {
    imprint: Schema.Attribute.RichText & Schema.Attribute.Required;
    privacy: Schema.Attribute.RichText & Schema.Attribute.Required;
    terms: Schema.Attribute.RichText;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: 'SEO-Metadaten fuer Seiten und Werkzeuge';
    displayName: 'SEO';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text;
    metaTitle: Schema.Attribute.String & Schema.Attribute.Required;
    ogImage: Schema.Attribute.Media<'images'>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'shared.legal': SharedLegal;
      'shared.seo': SharedSeo;
    }
  }
}
