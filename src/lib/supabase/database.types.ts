export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          details: Json | null;
          entity_id: string | null;
          entity_type: string;
          id: number;
          summary: string | null;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          details?: Json | null;
          entity_id?: string | null;
          entity_type: string;
          id?: never;
          summary?: string | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          details?: Json | null;
          entity_id?: string | null;
          entity_type?: string;
          id?: never;
          summary?: string | null;
        };
        Relationships: [];
      };
      affiliate_click_events: {
        Row: {
          anon_id: string | null;
          country: string | null;
          created_at: string;
          destination_host: string | null;
          device_type: string | null;
          id: number;
          ip_hash: string | null;
          is_suspected_bot: boolean;
          listing_id: string | null;
          merchant_id: string | null;
          offer_id: string | null;
          product_id: string | null;
          referrer_host: string | null;
          source_component: string | null;
          source_path: string | null;
          user_id: string | null;
          utm_campaign: string | null;
          utm_content: string | null;
          utm_medium: string | null;
          utm_source: string | null;
          utm_term: string | null;
        };
        ComputedFields: never;
        Insert: {
          anon_id?: string | null;
          country?: string | null;
          created_at?: string;
          destination_host?: string | null;
          device_type?: string | null;
          id?: never;
          ip_hash?: string | null;
          is_suspected_bot?: boolean;
          listing_id?: string | null;
          merchant_id?: string | null;
          offer_id?: string | null;
          product_id?: string | null;
          referrer_host?: string | null;
          source_component?: string | null;
          source_path?: string | null;
          user_id?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
          utm_term?: string | null;
        };
        Update: {
          anon_id?: string | null;
          country?: string | null;
          created_at?: string;
          destination_host?: string | null;
          device_type?: string | null;
          id?: never;
          ip_hash?: string | null;
          is_suspected_bot?: boolean;
          listing_id?: string | null;
          merchant_id?: string | null;
          offer_id?: string | null;
          product_id?: string | null;
          referrer_host?: string | null;
          source_component?: string | null;
          source_path?: string | null;
          user_id?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
          utm_term?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "affiliate_click_events_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "product_listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "affiliate_click_events_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "v_listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "affiliate_click_events_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "v_product_cards";
            referencedColumns: ["best_listing_id"];
          },
          {
            foreignKeyName: "affiliate_click_events_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "affiliate_click_events_offer_id_fkey";
            columns: ["offer_id"];
            isOneToOne: false;
            referencedRelation: "offers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "affiliate_click_events_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "affiliate_click_events_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "v_product_cards";
            referencedColumns: ["id"];
          },
        ];
      };
      affiliate_performance_reports: {
        Row: {
          clicks_reported: number | null;
          commission: number | null;
          created_at: string;
          created_by: string | null;
          currency: string;
          id: string;
          items_shipped: number | null;
          merchant_id: string;
          notes: string | null;
          orders: number | null;
          period_end: string;
          period_start: string;
          program_id: string | null;
          raw: Json | null;
          revenue: number | null;
          source: string;
        };
        ComputedFields: never;
        Insert: {
          clicks_reported?: number | null;
          commission?: number | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          id?: string;
          items_shipped?: number | null;
          merchant_id: string;
          notes?: string | null;
          orders?: number | null;
          period_end: string;
          period_start: string;
          program_id?: string | null;
          raw?: Json | null;
          revenue?: number | null;
          source?: string;
        };
        Update: {
          clicks_reported?: number | null;
          commission?: number | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          id?: string;
          items_shipped?: number | null;
          merchant_id?: string;
          notes?: string | null;
          orders?: number | null;
          period_end?: string;
          period_start?: string;
          program_id?: string | null;
          raw?: Json | null;
          revenue?: number | null;
          source?: string;
        };
        Relationships: [
          {
            foreignKeyName: "affiliate_performance_reports_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "affiliate_performance_reports_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "affiliate_programs";
            referencedColumns: ["id"];
          },
        ];
      };
      affiliate_programs: {
        Row: {
          adapter_key: string;
          api_status: string;
          created_at: string;
          documentation_url: string | null;
          id: string;
          integration_type: string;
          is_default: boolean;
          last_sync_at: string | null;
          last_sync_message: string | null;
          last_sync_status: string | null;
          merchant_id: string;
          name: string;
          network: string | null;
          notes: string | null;
          status: string;
          terms_url: string | null;
          tracking_id_ref: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          adapter_key?: string;
          api_status?: string;
          created_at?: string;
          documentation_url?: string | null;
          id?: string;
          integration_type?: string;
          is_default?: boolean;
          last_sync_at?: string | null;
          last_sync_message?: string | null;
          last_sync_status?: string | null;
          merchant_id: string;
          name: string;
          network?: string | null;
          notes?: string | null;
          status?: string;
          terms_url?: string | null;
          tracking_id_ref?: string | null;
          updated_at?: string;
        };
        Update: {
          adapter_key?: string;
          api_status?: string;
          created_at?: string;
          documentation_url?: string | null;
          id?: string;
          integration_type?: string;
          is_default?: boolean;
          last_sync_at?: string | null;
          last_sync_message?: string | null;
          last_sync_status?: string | null;
          merchant_id?: string;
          name?: string;
          network?: string | null;
          notes?: string | null;
          status?: string;
          terms_url?: string | null;
          tracking_id_ref?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "affiliate_programs_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
        ];
      };
      banners: {
        Row: {
          created_at: string;
          cta_label: string | null;
          cta_url: string | null;
          ends_at: string | null;
          eyebrow: string | null;
          id: string;
          image_alt: string | null;
          image_url: string | null;
          is_active: boolean;
          placement: string;
          secondary_cta_label: string | null;
          secondary_cta_url: string | null;
          sort_order: number;
          starts_at: string | null;
          subtitle: string | null;
          theme: string;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          cta_label?: string | null;
          cta_url?: string | null;
          ends_at?: string | null;
          eyebrow?: string | null;
          id?: string;
          image_alt?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          placement: string;
          secondary_cta_label?: string | null;
          secondary_cta_url?: string | null;
          sort_order?: number;
          starts_at?: string | null;
          subtitle?: string | null;
          theme?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          cta_label?: string | null;
          cta_url?: string | null;
          ends_at?: string | null;
          eyebrow?: string | null;
          id?: string;
          image_alt?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          placement?: string;
          secondary_cta_label?: string | null;
          secondary_cta_url?: string | null;
          sort_order?: number;
          starts_at?: string | null;
          subtitle?: string | null;
          theme?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      blog_authors: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          expertise: string[];
          id: string;
          is_active: boolean;
          job_title: string | null;
          name: string;
          profile_id: string | null;
          slug: string;
          social_links: NonNullable<Json>;
          updated_at: string;
          website_url: string | null;
        };
        ComputedFields: never;
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          expertise?: string[];
          id?: string;
          is_active?: boolean;
          job_title?: string | null;
          name: string;
          profile_id?: string | null;
          slug: string;
          social_links?: NonNullable<Json>;
          updated_at?: string;
          website_url?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          expertise?: string[];
          id?: string;
          is_active?: boolean;
          job_title?: string | null;
          name?: string;
          profile_id?: string | null;
          slug?: string;
          social_links?: NonNullable<Json>;
          updated_at?: string;
          website_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "blog_authors_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      blog_categories: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          meta_description: string | null;
          name: string;
          seo_title: string | null;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          meta_description?: string | null;
          name: string;
          seo_title?: string | null;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          meta_description?: string | null;
          name?: string;
          seo_title?: string | null;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      blog_post_products: {
        Row: {
          post_id: string;
          product_id: string;
          sort_order: number;
        };
        ComputedFields: never;
        Insert: {
          post_id: string;
          product_id: string;
          sort_order?: number;
        };
        Update: {
          post_id?: string;
          product_id?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "blog_post_products_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "blog_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blog_post_products_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blog_post_products_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "v_product_cards";
            referencedColumns: ["id"];
          },
        ];
      };
      blog_post_tags: {
        Row: {
          post_id: string;
          tag_id: string;
        };
        ComputedFields: never;
        Insert: {
          post_id: string;
          tag_id: string;
        };
        Update: {
          post_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "blog_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blog_post_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "blog_tags";
            referencedColumns: ["id"];
          },
        ];
      };
      blog_posts: {
        Row: {
          ai_assisted: boolean;
          answer_summary: string | null;
          author_id: string | null;
          canonical_url: string | null;
          category_id: string | null;
          content: string;
          content_updated_at: string | null;
          created_at: string;
          created_by: string | null;
          editor_notes: string | null;
          excerpt: string | null;
          faqs: NonNullable<Json>;
          featured_image_alt: string | null;
          featured_image_url: string | null;
          id: string;
          is_featured: boolean;
          meta_description: string | null;
          noindex: boolean;
          primary_keyword: string | null;
          product_category_id: string | null;
          published_at: string | null;
          reading_time_minutes: number | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          search_intent: string | null;
          secondary_keywords: string[];
          seo_title: string | null;
          slug: string;
          sources: NonNullable<Json>;
          status: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
          view_count: number;
        };
        ComputedFields: never;
        Insert: {
          ai_assisted?: boolean;
          answer_summary?: string | null;
          author_id?: string | null;
          canonical_url?: string | null;
          category_id?: string | null;
          content?: string;
          content_updated_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          editor_notes?: string | null;
          excerpt?: string | null;
          faqs?: NonNullable<Json>;
          featured_image_alt?: string | null;
          featured_image_url?: string | null;
          id?: string;
          is_featured?: boolean;
          meta_description?: string | null;
          noindex?: boolean;
          primary_keyword?: string | null;
          product_category_id?: string | null;
          published_at?: string | null;
          reading_time_minutes?: number | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          search_intent?: string | null;
          secondary_keywords?: string[];
          seo_title?: string | null;
          slug: string;
          sources?: NonNullable<Json>;
          status?: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
          view_count?: number;
        };
        Update: {
          ai_assisted?: boolean;
          answer_summary?: string | null;
          author_id?: string | null;
          canonical_url?: string | null;
          category_id?: string | null;
          content?: string;
          content_updated_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          editor_notes?: string | null;
          excerpt?: string | null;
          faqs?: NonNullable<Json>;
          featured_image_alt?: string | null;
          featured_image_url?: string | null;
          id?: string;
          is_featured?: boolean;
          meta_description?: string | null;
          noindex?: boolean;
          primary_keyword?: string | null;
          product_category_id?: string | null;
          published_at?: string | null;
          reading_time_minutes?: number | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          search_intent?: string | null;
          secondary_keywords?: string[];
          seo_title?: string | null;
          slug?: string;
          sources?: NonNullable<Json>;
          status?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
          view_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "blog_authors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blog_posts_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "blog_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blog_posts_product_category_id_fkey";
            columns: ["product_category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      blog_revisions: {
        Row: {
          content: string;
          created_at: string;
          created_by: string | null;
          excerpt: string | null;
          id: string;
          note: string | null;
          post_id: string;
          snapshot: NonNullable<Json>;
          title: string;
        };
        ComputedFields: never;
        Insert: {
          content: string;
          created_at?: string;
          created_by?: string | null;
          excerpt?: string | null;
          id?: string;
          note?: string | null;
          post_id: string;
          snapshot?: NonNullable<Json>;
          title: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          created_by?: string | null;
          excerpt?: string | null;
          id?: string;
          note?: string | null;
          post_id?: string;
          snapshot?: NonNullable<Json>;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blog_revisions_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "blog_posts";
            referencedColumns: ["id"];
          },
        ];
      };
      blog_tags: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      brands: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          slug: string;
          updated_at: string;
          website_url: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          slug: string;
          updated_at?: string;
          website_url?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
          website_url?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string;
          description: string | null;
          faqs: NonNullable<Json>;
          home_sort_order: number;
          icon: string | null;
          id: string;
          image_alt: string | null;
          image_url: string | null;
          is_active: boolean;
          meta_description: string | null;
          name: string;
          noindex: boolean;
          parent_id: string | null;
          seo_title: string | null;
          short_description: string | null;
          show_on_home: boolean;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description?: string | null;
          faqs?: NonNullable<Json>;
          home_sort_order?: number;
          icon?: string | null;
          id?: string;
          image_alt?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          meta_description?: string | null;
          name: string;
          noindex?: boolean;
          parent_id?: string | null;
          seo_title?: string | null;
          short_description?: string | null;
          show_on_home?: boolean;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          faqs?: NonNullable<Json>;
          home_sort_order?: number;
          icon?: string | null;
          id?: string;
          image_alt?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          meta_description?: string | null;
          name?: string;
          noindex?: boolean;
          parent_id?: string | null;
          seo_title?: string | null;
          short_description?: string | null;
          show_on_home?: boolean;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      comparison_items: {
        Row: {
          comparison_id: string;
          highlight: string | null;
          note: string | null;
          product_id: string;
          sort_order: number;
        };
        ComputedFields: never;
        Insert: {
          comparison_id: string;
          highlight?: string | null;
          note?: string | null;
          product_id: string;
          sort_order?: number;
        };
        Update: {
          comparison_id?: string;
          highlight?: string | null;
          note?: string | null;
          product_id?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "comparison_items_comparison_id_fkey";
            columns: ["comparison_id"];
            isOneToOne: false;
            referencedRelation: "comparisons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comparison_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comparison_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "v_product_cards";
            referencedColumns: ["id"];
          },
        ];
      };
      comparisons: {
        Row: {
          category_id: string | null;
          created_at: string;
          faqs: NonNullable<Json>;
          id: string;
          intro: string | null;
          is_featured: boolean;
          meta_description: string | null;
          published_at: string | null;
          seo_title: string | null;
          slug: string;
          spec_labels: string[];
          status: string;
          summary: string | null;
          title: string;
          updated_at: string;
          verdict: string | null;
        };
        ComputedFields: never;
        Insert: {
          category_id?: string | null;
          created_at?: string;
          faqs?: NonNullable<Json>;
          id?: string;
          intro?: string | null;
          is_featured?: boolean;
          meta_description?: string | null;
          published_at?: string | null;
          seo_title?: string | null;
          slug: string;
          spec_labels?: string[];
          status?: string;
          summary?: string | null;
          title: string;
          updated_at?: string;
          verdict?: string | null;
        };
        Update: {
          category_id?: string | null;
          created_at?: string;
          faqs?: NonNullable<Json>;
          id?: string;
          intro?: string | null;
          is_featured?: boolean;
          meta_description?: string | null;
          published_at?: string | null;
          seo_title?: string | null;
          slug?: string;
          spec_labels?: string[];
          status?: string;
          summary?: string | null;
          title?: string;
          updated_at?: string;
          verdict?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "comparisons_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_messages: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          ip_hash: string | null;
          message: string;
          name: string;
          status: string;
          subject: string;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          ip_hash?: string | null;
          message: string;
          name: string;
          status?: string;
          subject: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          ip_hash?: string | null;
          message?: string;
          name?: string;
          status?: string;
          subject?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      content_views_daily: {
        Row: {
          day: string;
          entity_id: string;
          entity_type: string;
          views: number;
        };
        ComputedFields: never;
        Insert: {
          day?: string;
          entity_id: string;
          entity_type: string;
          views?: number;
        };
        Update: {
          day?: string;
          entity_id?: string;
          entity_type?: string;
          views?: number;
        };
        Relationships: [];
      };
      merchants: {
        Row: {
          allow_manual_prices: boolean;
          allowed_domains: string[];
          brand_color: string | null;
          created_at: string;
          description: string | null;
          disclosure_text: string | null;
          highlights: NonNullable<Json>;
          id: string;
          is_active: boolean;
          is_featured: boolean;
          logo_url: string | null;
          logo_usage_permitted: boolean;
          meta_description: string | null;
          name: string;
          policy_links: NonNullable<Json>;
          price_max_age_hours: number | null;
          seo_title: string | null;
          short_description: string | null;
          slug: string;
          sort_order: number;
          updated_at: string;
          visit_url: string | null;
          website_url: string;
        };
        ComputedFields: never;
        Insert: {
          allow_manual_prices?: boolean;
          allowed_domains?: string[];
          brand_color?: string | null;
          created_at?: string;
          description?: string | null;
          disclosure_text?: string | null;
          highlights?: NonNullable<Json>;
          id?: string;
          is_active?: boolean;
          is_featured?: boolean;
          logo_url?: string | null;
          logo_usage_permitted?: boolean;
          meta_description?: string | null;
          name: string;
          policy_links?: NonNullable<Json>;
          price_max_age_hours?: number | null;
          seo_title?: string | null;
          short_description?: string | null;
          slug: string;
          sort_order?: number;
          updated_at?: string;
          visit_url?: string | null;
          website_url: string;
        };
        Update: {
          allow_manual_prices?: boolean;
          allowed_domains?: string[];
          brand_color?: string | null;
          created_at?: string;
          description?: string | null;
          disclosure_text?: string | null;
          highlights?: NonNullable<Json>;
          id?: string;
          is_active?: boolean;
          is_featured?: boolean;
          logo_url?: string | null;
          logo_usage_permitted?: boolean;
          meta_description?: string | null;
          name?: string;
          policy_links?: NonNullable<Json>;
          price_max_age_hours?: number | null;
          seo_title?: string | null;
          short_description?: string | null;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
          visit_url?: string | null;
          website_url?: string;
        };
        Relationships: [];
      };
      newsletter_subscribers: {
        Row: {
          consent_at: string;
          consent_source: string | null;
          consent_text: string;
          created_at: string;
          email: string;
          id: string;
          ip_hash: string | null;
          provider_error: string | null;
          provider_synced_at: string | null;
          status: string;
          unsubscribe_token: string;
          unsubscribed_at: string | null;
          updated_at: string;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          consent_at?: string;
          consent_source?: string | null;
          consent_text: string;
          created_at?: string;
          email: string;
          id?: string;
          ip_hash?: string | null;
          provider_error?: string | null;
          provider_synced_at?: string | null;
          status?: string;
          unsubscribe_token?: string;
          unsubscribed_at?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          consent_at?: string;
          consent_source?: string | null;
          consent_text?: string;
          created_at?: string;
          email?: string;
          id?: string;
          ip_hash?: string | null;
          provider_error?: string | null;
          provider_synced_at?: string | null;
          status?: string;
          unsubscribe_token?: string;
          unsubscribed_at?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      offers: {
        Row: {
          category_id: string | null;
          click_count: number;
          coupon_code: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          discount_text: string | null;
          expires_at: string | null;
          id: string;
          image_alt: string | null;
          image_url: string | null;
          is_featured: boolean;
          listing_id: string | null;
          merchant_id: string;
          offer_url: string;
          product_id: string | null;
          slug: string;
          sort_order: number;
          source_url: string | null;
          starts_at: string | null;
          status: string;
          terms: string | null;
          title: string;
          updated_at: string;
          updated_by: string | null;
          verified_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          category_id?: string | null;
          click_count?: number;
          coupon_code?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          discount_text?: string | null;
          expires_at?: string | null;
          id?: string;
          image_alt?: string | null;
          image_url?: string | null;
          is_featured?: boolean;
          listing_id?: string | null;
          merchant_id: string;
          offer_url: string;
          product_id?: string | null;
          slug: string;
          sort_order?: number;
          source_url?: string | null;
          starts_at?: string | null;
          status?: string;
          terms?: string | null;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
          verified_at?: string | null;
        };
        Update: {
          category_id?: string | null;
          click_count?: number;
          coupon_code?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          discount_text?: string | null;
          expires_at?: string | null;
          id?: string;
          image_alt?: string | null;
          image_url?: string | null;
          is_featured?: boolean;
          listing_id?: string | null;
          merchant_id?: string;
          offer_url?: string;
          product_id?: string | null;
          slug?: string;
          sort_order?: number;
          source_url?: string | null;
          starts_at?: string | null;
          status?: string;
          terms?: string | null;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "offers_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "offers_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "product_listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "offers_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "v_listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "offers_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "v_product_cards";
            referencedColumns: ["best_listing_id"];
          },
          {
            foreignKeyName: "offers_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "offers_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "offers_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "v_product_cards";
            referencedColumns: ["id"];
          },
        ];
      };
      product_images: {
        Row: {
          alt_text: string;
          created_at: string;
          credit: string | null;
          height: number | null;
          id: string;
          product_id: string;
          sort_order: number;
          source: string;
          source_url: string | null;
          storage_path: string | null;
          url: string;
          width: number | null;
        };
        ComputedFields: never;
        Insert: {
          alt_text: string;
          created_at?: string;
          credit?: string | null;
          height?: number | null;
          id?: string;
          product_id: string;
          sort_order?: number;
          source?: string;
          source_url?: string | null;
          storage_path?: string | null;
          url: string;
          width?: number | null;
        };
        Update: {
          alt_text?: string;
          created_at?: string;
          credit?: string | null;
          height?: number | null;
          id?: string;
          product_id?: string;
          sort_order?: number;
          source?: string;
          source_url?: string | null;
          storage_path?: string | null;
          url?: string;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "v_product_cards";
            referencedColumns: ["id"];
          },
        ];
      };
      product_listings: {
        Row: {
          affiliate_url: string;
          availability: string;
          coupon_code: string | null;
          created_at: string;
          created_by: string | null;
          currency: string;
          current_price: number | null;
          destination_url: string;
          id: string;
          internal_notes: string | null;
          is_active: boolean;
          last_synced_at: string | null;
          merchant_id: string;
          merchant_product_id: string | null;
          offer_details: string | null;
          offer_expires_at: string | null;
          previous_price: number | null;
          previous_price_type: string;
          price_checked_at: string | null;
          price_source: string;
          product_id: string;
          program_id: string | null;
          sort_order: number;
          sync_error: string | null;
          updated_at: string;
          updated_by: string | null;
          url_check_message: string | null;
          url_checked_at: string | null;
          url_status: string;
          variant_label: string;
        };
        ComputedFields: never;
        Insert: {
          affiliate_url: string;
          availability?: string;
          coupon_code?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          current_price?: number | null;
          destination_url: string;
          id?: string;
          internal_notes?: string | null;
          is_active?: boolean;
          last_synced_at?: string | null;
          merchant_id: string;
          merchant_product_id?: string | null;
          offer_details?: string | null;
          offer_expires_at?: string | null;
          previous_price?: number | null;
          previous_price_type?: string;
          price_checked_at?: string | null;
          price_source?: string;
          product_id: string;
          program_id?: string | null;
          sort_order?: number;
          sync_error?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          url_check_message?: string | null;
          url_checked_at?: string | null;
          url_status?: string;
          variant_label?: string;
        };
        Update: {
          affiliate_url?: string;
          availability?: string;
          coupon_code?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          current_price?: number | null;
          destination_url?: string;
          id?: string;
          internal_notes?: string | null;
          is_active?: boolean;
          last_synced_at?: string | null;
          merchant_id?: string;
          merchant_product_id?: string | null;
          offer_details?: string | null;
          offer_expires_at?: string | null;
          previous_price?: number | null;
          previous_price_type?: string;
          price_checked_at?: string | null;
          price_source?: string;
          product_id?: string;
          program_id?: string | null;
          sort_order?: number;
          sync_error?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          url_check_message?: string | null;
          url_checked_at?: string | null;
          url_status?: string;
          variant_label?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_listings_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_listings_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_listings_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "v_product_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_listings_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "affiliate_programs";
            referencedColumns: ["id"];
          },
        ];
      };
      product_relations: {
        Row: {
          created_at: string;
          note: string | null;
          product_id: string;
          related_product_id: string;
          relation_type: string;
          sort_order: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          note?: string | null;
          product_id: string;
          related_product_id: string;
          relation_type?: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          note?: string | null;
          product_id?: string;
          related_product_id?: string;
          relation_type?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "product_relations_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_relations_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "v_product_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_relations_related_product_id_fkey";
            columns: ["related_product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_relations_related_product_id_fkey";
            columns: ["related_product_id"];
            isOneToOne: false;
            referencedRelation: "v_product_cards";
            referencedColumns: ["id"];
          },
        ];
      };
      product_specs: {
        Row: {
          created_at: string;
          group_name: string;
          id: string;
          label: string;
          product_id: string;
          sort_order: number;
          source_url: string | null;
          value: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          group_name?: string;
          id?: string;
          label: string;
          product_id: string;
          sort_order?: number;
          source_url?: string | null;
          value: string;
        };
        Update: {
          created_at?: string;
          group_name?: string;
          id?: string;
          label?: string;
          product_id?: string;
          sort_order?: number;
          source_url?: string | null;
          value?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_specs_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_specs_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "v_product_cards";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          best_for: string | null;
          brand_id: string | null;
          buying_considerations: string | null;
          canonical_url: string | null;
          category_id: string | null;
          click_count: number;
          cons: string[];
          content_reviewed_at: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          faqs: NonNullable<Json>;
          id: string;
          is_featured: boolean;
          is_trending: boolean;
          key_features: string[];
          meta_description: string | null;
          model_number: string | null;
          name: string;
          noindex: boolean;
          not_ideal_for: string | null;
          overview: string | null;
          popularity_score: number | null;
          pros: string[];
          published_at: string | null;
          search_keywords: string | null;
          search_vector: unknown;
          seo_title: string | null;
          short_description: string | null;
          slug: string;
          sources: NonNullable<Json>;
          status: string;
          trending_reason: string | null;
          updated_at: string;
          updated_by: string | null;
          view_count: number;
        };
        ComputedFields: never;
        Insert: {
          best_for?: string | null;
          brand_id?: string | null;
          buying_considerations?: string | null;
          canonical_url?: string | null;
          category_id?: string | null;
          click_count?: number;
          cons?: string[];
          content_reviewed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          faqs?: NonNullable<Json>;
          id?: string;
          is_featured?: boolean;
          is_trending?: boolean;
          key_features?: string[];
          meta_description?: string | null;
          model_number?: string | null;
          name: string;
          noindex?: boolean;
          not_ideal_for?: string | null;
          overview?: string | null;
          popularity_score?: never;
          pros?: string[];
          published_at?: string | null;
          search_keywords?: string | null;
          search_vector?: never;
          seo_title?: string | null;
          short_description?: string | null;
          slug: string;
          sources?: NonNullable<Json>;
          status?: string;
          trending_reason?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          view_count?: number;
        };
        Update: {
          best_for?: string | null;
          brand_id?: string | null;
          buying_considerations?: string | null;
          canonical_url?: string | null;
          category_id?: string | null;
          click_count?: number;
          cons?: string[];
          content_reviewed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          faqs?: NonNullable<Json>;
          id?: string;
          is_featured?: boolean;
          is_trending?: boolean;
          key_features?: string[];
          meta_description?: string | null;
          model_number?: string | null;
          name?: string;
          noindex?: boolean;
          not_ideal_for?: string | null;
          overview?: string | null;
          popularity_score?: never;
          pros?: string[];
          published_at?: string | null;
          search_keywords?: string | null;
          search_vector?: never;
          seo_title?: string | null;
          short_description?: string | null;
          slug?: string;
          sources?: NonNullable<Json>;
          status?: string;
          trending_reason?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          view_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          deletion_reason: string | null;
          deletion_requested_at: string | null;
          email: string | null;
          full_name: string | null;
          id: string;
          newsletter_opt_in: boolean;
          notification_prefs: NonNullable<Json>;
          privacy_prefs: NonNullable<Json>;
          status: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          deletion_reason?: string | null;
          deletion_requested_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id: string;
          newsletter_opt_in?: boolean;
          notification_prefs?: NonNullable<Json>;
          privacy_prefs?: NonNullable<Json>;
          status?: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          deletion_reason?: string | null;
          deletion_requested_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          newsletter_opt_in?: boolean;
          notification_prefs?: NonNullable<Json>;
          privacy_prefs?: NonNullable<Json>;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rate_limits: {
        Row: {
          hits: number;
          key: string;
          window_start: string;
        };
        ComputedFields: never;
        Insert: {
          hits?: number;
          key: string;
          window_start?: string;
        };
        Update: {
          hits?: number;
          key?: string;
          window_start?: string;
        };
        Relationships: [];
      };
      recently_viewed: {
        Row: {
          product_id: string;
          user_id: string;
          viewed_at: string;
        };
        ComputedFields: never;
        Insert: {
          product_id: string;
          user_id: string;
          viewed_at?: string;
        };
        Update: {
          product_id?: string;
          user_id?: string;
          viewed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recently_viewed_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recently_viewed_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "v_product_cards";
            referencedColumns: ["id"];
          },
        ];
      };
      roles: {
        Row: {
          description: string;
          key: string;
          name: string;
          permissions: string[];
        };
        ComputedFields: never;
        Insert: {
          description: string;
          key: string;
          name: string;
          permissions?: string[];
        };
        Update: {
          description?: string;
          key?: string;
          name?: string;
          permissions?: string[];
        };
        Relationships: [];
      };
      search_queries: {
        Row: {
          created_at: string;
          id: number;
          normalized_query: string;
          query: string;
          results_count: number;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: never;
          normalized_query: string;
          query: string;
          results_count?: number;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: never;
          normalized_query?: string;
          query?: string;
          results_count?: number;
          user_id?: string | null;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          affiliate_disclosure_content: string | null;
          affiliate_disclosure_short: string | null;
          amazon_associate_statement: string;
          announcement_text: string | null;
          announcement_url: string | null;
          brand_name: string;
          contact_address: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          default_og_image_url: string | null;
          favicon_url: string | null;
          footer_about: string | null;
          google_site_verification: string | null;
          id: number;
          logo_url: string | null;
          newsletter_consent_text: string | null;
          newsletter_enabled: boolean;
          newsletter_heading: string | null;
          newsletter_subheading: string | null;
          seo_default_description: string | null;
          seo_default_title: string | null;
          seo_title_template: string | null;
          social_links: NonNullable<Json>;
          tagline: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          affiliate_disclosure_content?: string | null;
          affiliate_disclosure_short?: string | null;
          amazon_associate_statement?: string;
          announcement_text?: string | null;
          announcement_url?: string | null;
          brand_name?: string;
          contact_address?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          default_og_image_url?: string | null;
          favicon_url?: string | null;
          footer_about?: string | null;
          google_site_verification?: string | null;
          id?: number;
          logo_url?: string | null;
          newsletter_consent_text?: string | null;
          newsletter_enabled?: boolean;
          newsletter_heading?: string | null;
          newsletter_subheading?: string | null;
          seo_default_description?: string | null;
          seo_default_title?: string | null;
          seo_title_template?: string | null;
          social_links?: NonNullable<Json>;
          tagline?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          affiliate_disclosure_content?: string | null;
          affiliate_disclosure_short?: string | null;
          amazon_associate_statement?: string;
          announcement_text?: string | null;
          announcement_url?: string | null;
          brand_name?: string;
          contact_address?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          default_og_image_url?: string | null;
          favicon_url?: string | null;
          footer_about?: string | null;
          google_site_verification?: string | null;
          id?: number;
          logo_url?: string | null;
          newsletter_consent_text?: string | null;
          newsletter_enabled?: boolean;
          newsletter_heading?: string | null;
          newsletter_subheading?: string | null;
          seo_default_description?: string | null;
          seo_default_title?: string | null;
          seo_title_template?: string | null;
          social_links?: NonNullable<Json>;
          tagline?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          granted_by: string | null;
          role: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          granted_by?: string | null;
          role: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          granted_by?: string | null;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_role_fkey";
            columns: ["role"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["key"];
          },
        ];
      };
      wishlist_items: {
        Row: {
          created_at: string;
          product_id: string;
          wishlist_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          product_id: string;
          wishlist_id: string;
        };
        Update: {
          created_at?: string;
          product_id?: string;
          wishlist_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wishlist_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "v_product_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wishlist_items_wishlist_id_fkey";
            columns: ["wishlist_id"];
            isOneToOne: false;
            referencedRelation: "wishlists";
            referencedColumns: ["id"];
          },
        ];
      };
      wishlists: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      v_listings: {
        Row: {
          affiliate_url: string;
          availability: string;
          coupon_code: string | null;
          created_at: string;
          created_by: string | null;
          currency: string;
          current_price: number | null;
          destination_url: string;
          id: string;
          internal_notes: string | null;
          is_active: boolean;
          last_synced_at: string | null;
          merchant_brand_color: string | null;
          merchant_disclosure_text: string | null;
          merchant_id: string;
          merchant_is_active: boolean;
          merchant_logo_url: string | null;
          merchant_logo_usage_permitted: boolean;
          merchant_name: string;
          merchant_price_max_age_hours: number | null;
          merchant_product_id: string | null;
          merchant_slug: string;
          offer_details: string | null;
          offer_expires_at: string | null;
          previous_price: number | null;
          previous_price_type: string;
          price_checked_at: string | null;
          price_displayable: boolean | null;
          price_source: string;
          product_id: string;
          program_id: string | null;
          sort_order: number;
          sync_error: string | null;
          updated_at: string;
          updated_by: string | null;
          url_check_message: string | null;
          url_checked_at: string | null;
          url_status: string;
          variant_label: string;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "product_listings_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_listings_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_listings_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "v_product_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_listings_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "affiliate_programs";
            referencedColumns: ["id"];
          },
        ];
      };
      v_product_cards: {
        Row: {
          best_affiliate_url: string | null;
          best_availability: string | null;
          best_listing_id: string | null;
          best_merchant_id: string | null;
          best_merchant_name: string | null;
          best_merchant_slug: string | null;
          best_previous_price: number | null;
          best_price: number | null;
          best_price_checked_at: string | null;
          brand_id: string | null;
          brand_name: string | null;
          category_id: string | null;
          category_name: string | null;
          category_slug: string | null;
          id: string;
          image_alt: string | null;
          image_source: string | null;
          image_url: string | null;
          is_featured: boolean;
          is_trending: boolean;
          listing_count: number | null;
          merchant_slugs: unknown[] | null;
          name: string;
          popularity_score: number | null;
          published_at: string | null;
          search_vector: unknown;
          short_description: string | null;
          slug: string;
          status: string;
          trending_reason: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "product_listings_merchant_id_fkey";
            columns: ["best_merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      admin_click_trend: {
        Args: { p_days?: number };
        Returns: {
          clicks: number;
          day: string;
        }[];
      };
      admin_clicks_by_merchant: {
        Args: { p_days?: number };
        Returns: {
          clicks: number;
          merchant_id: string;
          merchant_name: string;
        }[];
      };
      admin_clicks_by_source: {
        Args: { p_days?: number };
        Returns: {
          clicks: number;
          source_component: string;
        }[];
      };
      admin_overview_stats: { Args: Record<PropertyKey, never>; Returns: Json };
      admin_popular_content: {
        Args: { p_days?: number; p_entity_type: string; p_limit?: number };
        Returns: {
          entity_id: string;
          views: number;
        }[];
      };
      admin_top_clicked_products: {
        Args: { p_days?: number; p_limit?: number };
        Returns: {
          clicks: number;
          product_id: string;
          product_name: string;
          product_slug: string;
        }[];
      };
      admin_top_search_terms: {
        Args: { p_days?: number; p_limit?: number };
        Returns: {
          avg_results: number;
          searches: number;
          term: string;
        }[];
      };
      check_rate_limit: {
        Args: { p_key: string; p_max: number; p_window_seconds: number };
        Returns: boolean;
      };
      has_role: { Args: { p_role: string }; Returns: boolean };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_staff: { Args: Record<PropertyKey, never>; Returns: boolean };
      track_content_view: {
        Args: { p_entity_id: string; p_entity_type: string };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
