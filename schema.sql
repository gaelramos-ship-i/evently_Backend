-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.Events (
  id_event bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  title_event character varying,
  desc_event text,
  date_event date,
  price_event double precision,
  img_url character varying,
  place_event character varying,
  city_event character varying,
  source_url character varying,
  fk_id_category bigint NOT NULL,
  CONSTRAINT Events_pkey PRIMARY KEY (id_event),
  CONSTRAINT Events_fk_id_category_fkey FOREIGN KEY (fk_id_category) REFERENCES public.Categories(id_category)
);
CREATE TABLE public.Users (
  id_user bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name_user character varying,
  email_user character varying,
  pass_user character varying,
  CONSTRAINT Users_pkey PRIMARY KEY (id_user)
);
CREATE TABLE public.Favoris (
  fk_id_user bigint NOT NULL,
  fk_id_event bigint NOT NULL,
  date_ajout date,
  CONSTRAINT Favoris_pkey PRIMARY KEY (fk_id_user, fk_id_event),
  CONSTRAINT Favoris_fk_id_user_fkey FOREIGN KEY (fk_id_user) REFERENCES public.Users(id_user),
  CONSTRAINT Favoris_fk_id_event_fkey FOREIGN KEY (fk_id_event) REFERENCES public.Events(id_event)
);
CREATE TABLE public.Categories (
  id_category bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name_category character varying,
  CONSTRAINT Categories_pkey PRIMARY KEY (id_category)
);