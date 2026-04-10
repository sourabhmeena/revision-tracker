--
-- PostgreSQL database dump
--

\restrict nbKfnnmCkxS1dmaNkNH5KTzMi9hfQozeEwzKVFZbRtqPwVjYcZNyRtvVmpAZdO2

-- Dumped from database version 17.8 (a48d9ca)
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: neon_auth; Type: SCHEMA; Schema: -; Owner: neon_auth
--

CREATE SCHEMA neon_auth;


ALTER SCHEMA neon_auth OWNER TO neon_auth;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.account (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" uuid NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp with time zone,
    "refreshTokenExpiresAt" timestamp with time zone,
    scope text,
    password text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE neon_auth.account OWNER TO neon_auth;

--
-- Name: invitation; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.invitation (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "organizationId" uuid NOT NULL,
    email text NOT NULL,
    role text,
    status text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "inviterId" uuid NOT NULL
);


ALTER TABLE neon_auth.invitation OWNER TO neon_auth;

--
-- Name: jwks; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.jwks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "publicKey" text NOT NULL,
    "privateKey" text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "expiresAt" timestamp with time zone
);


ALTER TABLE neon_auth.jwks OWNER TO neon_auth;

--
-- Name: member; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.member (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "organizationId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    role text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL
);


ALTER TABLE neon_auth.member OWNER TO neon_auth;

--
-- Name: organization; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.organization (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    logo text,
    "createdAt" timestamp with time zone NOT NULL,
    metadata text
);


ALTER TABLE neon_auth.organization OWNER TO neon_auth;

--
-- Name: project_config; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.project_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    endpoint_id text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    trusted_origins jsonb NOT NULL,
    social_providers jsonb NOT NULL,
    email_provider jsonb,
    email_and_password jsonb,
    allow_localhost boolean NOT NULL,
    plugin_configs jsonb,
    webhook_config jsonb
);


ALTER TABLE neon_auth.project_config OWNER TO neon_auth;

--
-- Name: session; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.session (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    token text NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "userId" uuid NOT NULL,
    "impersonatedBy" text,
    "activeOrganizationId" text
);


ALTER TABLE neon_auth.session OWNER TO neon_auth;

--
-- Name: user; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth."user" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "emailVerified" boolean NOT NULL,
    image text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    role text,
    banned boolean,
    "banReason" text,
    "banExpires" timestamp with time zone
);


ALTER TABLE neon_auth."user" OWNER TO neon_auth;

--
-- Name: verification; Type: TABLE; Schema: neon_auth; Owner: neon_auth
--

CREATE TABLE neon_auth.verification (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE neon_auth.verification OWNER TO neon_auth;

--
-- Name: revisions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.revisions (
    id character varying NOT NULL,
    topic_id character varying,
    revision_date date NOT NULL,
    completed boolean
);


ALTER TABLE public.revisions OWNER TO neondb_owner;

--
-- Name: topics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.topics (
    id character varying NOT NULL,
    user_id character varying NOT NULL,
    title character varying NOT NULL,
    created_at date NOT NULL,
    revision_intervals character varying,
    repeat_interval integer
);


ALTER TABLE public.topics OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id character varying NOT NULL,
    email character varying NOT NULL,
    hashed_password character varying NOT NULL,
    created_at date NOT NULL,
    revision_intervals character varying,
    repeat_interval integer
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Data for Name: account; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.account (id, "accountId", "providerId", "userId", "accessToken", "refreshToken", "idToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", scope, password, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: invitation; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.invitation (id, "organizationId", email, role, status, "expiresAt", "createdAt", "inviterId") FROM stdin;
\.


--
-- Data for Name: jwks; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.jwks (id, "publicKey", "privateKey", "createdAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: member; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.member (id, "organizationId", "userId", role, "createdAt") FROM stdin;
\.


--
-- Data for Name: organization; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.organization (id, name, slug, logo, "createdAt", metadata) FROM stdin;
\.


--
-- Data for Name: project_config; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.project_config (id, name, endpoint_id, created_at, updated_at, trusted_origins, social_providers, email_provider, email_and_password, allow_localhost, plugin_configs, webhook_config) FROM stdin;
f35fc833-301a-4dbe-a628-80e1760f4926	revision-planner	ep-flat-surf-am4hlxmx	2026-04-10 16:00:51.774+00	2026-04-10 16:00:51.774+00	[]	[{"id": "google", "isShared": true}]	{"type": "shared"}	{"enabled": true, "disableSignUp": false, "emailVerificationMethod": "otp", "requireEmailVerification": false, "autoSignInAfterVerification": true, "sendVerificationEmailOnSignIn": false, "sendVerificationEmailOnSignUp": false}	t	{"organization": {"config": {"creatorRole": "owner", "membershipLimit": 100, "organizationLimit": 10, "sendInvitationEmail": false}, "enabled": true}}	{"enabled": false, "enabledEvents": [], "timeoutSeconds": 5}
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.session (id, "expiresAt", token, "createdAt", "updatedAt", "ipAddress", "userAgent", "userId", "impersonatedBy", "activeOrganizationId") FROM stdin;
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth."user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt", role, banned, "banReason", "banExpires") FROM stdin;
\.


--
-- Data for Name: verification; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: revisions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.revisions (id, topic_id, revision_date, completed) FROM stdin;
51e2c5aa-93c3-428a-bb30-a629c2133676	be052828-d692-4365-9477-e2a3483d3009	2026-04-11	f
e32e7e77-9c06-47a4-a821-2747e02f0725	be052828-d692-4365-9477-e2a3483d3009	2026-04-14	f
5b4bcdfe-7b34-4022-990f-cc0b6df7c576	be052828-d692-4365-9477-e2a3483d3009	2026-04-21	f
44c676ab-8a9d-40b5-ad79-589828e18a3d	be052828-d692-4365-9477-e2a3483d3009	2026-05-12	f
67f3798e-820c-4a49-8b6b-b4a31c2db6b2	be052828-d692-4365-9477-e2a3483d3009	2026-06-11	f
7e5d1607-40bc-47b8-b5a5-40649aca0cc3	be052828-d692-4365-9477-e2a3483d3009	2026-07-11	f
c202cf75-2fce-4423-b6d0-289ea15c36be	be052828-d692-4365-9477-e2a3483d3009	2026-08-10	f
e9c3e4b1-cdcd-4e64-80e7-66b0ae78fa73	be052828-d692-4365-9477-e2a3483d3009	2026-09-09	f
6e0f47d9-637d-4bbe-a708-19d1b429376d	be052828-d692-4365-9477-e2a3483d3009	2026-10-09	f
d1ee4e99-01ee-4b09-8c19-8b6f05ff0e12	be052828-d692-4365-9477-e2a3483d3009	2026-11-08	f
800f4fe3-5c01-409c-9e4d-35b41b274ba8	be052828-d692-4365-9477-e2a3483d3009	2026-12-08	f
dc26cb3c-26db-409a-ba1b-7e63ee48be9a	be052828-d692-4365-9477-e2a3483d3009	2027-01-07	f
32efa2f0-6bc3-4ff4-b894-53ffda2530bb	be052828-d692-4365-9477-e2a3483d3009	2027-02-06	f
dfbfdc61-f650-48a7-9a1f-84b2ac06f9a0	be052828-d692-4365-9477-e2a3483d3009	2027-03-08	f
a9e42de0-3477-4047-a274-b4deaff82c2f	be052828-d692-4365-9477-e2a3483d3009	2027-04-07	f
a177fe6c-24e5-4d42-9b30-62bf65ef9922	be052828-d692-4365-9477-e2a3483d3009	2027-05-07	f
98a85993-7202-4f0c-8b97-059fc3183952	be052828-d692-4365-9477-e2a3483d3009	2027-06-06	f
7d2d6697-12fd-4b06-a1f2-67cf5dd58b44	be052828-d692-4365-9477-e2a3483d3009	2027-07-06	f
31087f19-3b3a-43d4-8769-83ccdba0ef48	be052828-d692-4365-9477-e2a3483d3009	2027-08-05	f
3f7b5157-1302-40d0-abcc-c6f70af7c3a2	be052828-d692-4365-9477-e2a3483d3009	2027-09-04	f
fc420696-d05d-496e-9ccf-3dd91d87908c	be052828-d692-4365-9477-e2a3483d3009	2027-10-04	f
f881c710-e0d9-4aa3-9086-890ae541ea1f	be052828-d692-4365-9477-e2a3483d3009	2027-11-03	f
d0cb0d09-a81b-47b5-91d0-e1ecedc5b16f	be052828-d692-4365-9477-e2a3483d3009	2027-12-03	f
fdfb8ff8-dd7e-42af-886f-6e78a32b1193	be052828-d692-4365-9477-e2a3483d3009	2028-01-02	f
fcd0179e-1f39-4de2-a7f0-10a61ae46eb7	be052828-d692-4365-9477-e2a3483d3009	2028-02-01	f
ecb40523-4202-4401-b912-c89c67495b88	be052828-d692-4365-9477-e2a3483d3009	2028-03-02	f
18494490-df70-4092-b7c1-d37d79e8253c	be052828-d692-4365-9477-e2a3483d3009	2028-04-01	f
bf3b9563-d3f8-4061-9b39-ba6dc06b4cba	be052828-d692-4365-9477-e2a3483d3009	2028-05-01	f
91d310d9-3304-405d-9008-d524a3fc4cb3	be052828-d692-4365-9477-e2a3483d3009	2028-05-31	f
d811788e-ff15-4949-85eb-f20dd35364af	be052828-d692-4365-9477-e2a3483d3009	2028-06-30	f
502f5003-21dd-4f76-be55-663eeacacd25	be052828-d692-4365-9477-e2a3483d3009	2028-07-30	f
d1a76276-9d13-40f3-b31b-d43fd35df936	be052828-d692-4365-9477-e2a3483d3009	2028-08-29	f
90c1e2be-bc11-4899-a4fd-2d910795db19	be052828-d692-4365-9477-e2a3483d3009	2028-09-28	f
6dbc6ccd-0858-4f55-89d9-69f46c12a416	be052828-d692-4365-9477-e2a3483d3009	2028-10-28	f
c652e7e2-fa31-45d0-89d3-6cdd8969e20a	be052828-d692-4365-9477-e2a3483d3009	2028-11-27	f
a0c0d978-4aa3-4783-aa28-40605f6725dd	be052828-d692-4365-9477-e2a3483d3009	2028-12-27	f
c225691a-12e7-4aed-8a59-a4f993193284	be052828-d692-4365-9477-e2a3483d3009	2029-01-26	f
3a3a39c5-b072-497c-ad0c-f4abd1fa5b82	be052828-d692-4365-9477-e2a3483d3009	2029-02-25	f
81c76aad-92e2-45d1-a1ad-d6036ebc7f78	be052828-d692-4365-9477-e2a3483d3009	2029-03-27	f
79e029a0-4fe0-478a-a89d-059906d8ef17	be052828-d692-4365-9477-e2a3483d3009	2029-04-26	f
f25370b7-58f0-4e1b-b17e-522fc0f11726	be052828-d692-4365-9477-e2a3483d3009	2029-05-26	f
8a81d371-ac95-4cf7-9de0-d8bca86ca2ea	be052828-d692-4365-9477-e2a3483d3009	2029-06-25	f
44464946-0f31-47e9-a865-d0b75da1a585	be052828-d692-4365-9477-e2a3483d3009	2029-07-25	f
68847b24-6ecd-4b0a-9554-c9b7b918fded	be052828-d692-4365-9477-e2a3483d3009	2029-08-24	f
3dcb1ac9-a8ad-4056-9f51-88ac4009a005	be052828-d692-4365-9477-e2a3483d3009	2029-09-23	f
0678486e-ae15-4a2c-82c2-821191e7c94a	be052828-d692-4365-9477-e2a3483d3009	2029-10-23	f
56dedc03-1814-47d8-aea6-8a76d824c33e	be052828-d692-4365-9477-e2a3483d3009	2029-11-22	f
9068d248-0c7e-43f0-83e1-c429a0e52207	be052828-d692-4365-9477-e2a3483d3009	2029-12-22	f
9281152e-b660-4df5-822e-475a77d6d80b	be052828-d692-4365-9477-e2a3483d3009	2030-01-21	f
6a8085e2-a30c-4ca7-a99e-bd153099641f	be052828-d692-4365-9477-e2a3483d3009	2030-02-20	f
0a72beec-cbaf-430c-b025-36c32259af6a	be052828-d692-4365-9477-e2a3483d3009	2030-03-22	f
f21c4e66-6dfd-4a79-ac09-876b9ebd6b54	be052828-d692-4365-9477-e2a3483d3009	2030-04-21	f
d2442eb8-4776-406f-bef9-62ed69057c33	be052828-d692-4365-9477-e2a3483d3009	2030-05-21	f
21c4d8e4-334e-4dfe-983d-d98acce4ba6e	be052828-d692-4365-9477-e2a3483d3009	2030-06-20	f
c9b77dfa-f1d1-4e15-a386-43e41519a5ca	be052828-d692-4365-9477-e2a3483d3009	2030-07-20	f
c3253365-1e15-4611-8430-3b814824042b	be052828-d692-4365-9477-e2a3483d3009	2030-08-19	f
8505af16-f9bf-4b5f-b35f-5266cb6be079	be052828-d692-4365-9477-e2a3483d3009	2030-09-18	f
164efa2a-9194-424f-8a40-fc9257336699	be052828-d692-4365-9477-e2a3483d3009	2030-10-18	f
8441a6dd-7f7f-4328-af08-9e87f0c3602e	be052828-d692-4365-9477-e2a3483d3009	2030-11-17	f
20df26a4-697e-4363-bd27-60eb53ef149c	be052828-d692-4365-9477-e2a3483d3009	2030-12-17	f
8bcfca6f-d5e5-48cc-a8d7-a458abd19f30	be052828-d692-4365-9477-e2a3483d3009	2031-01-16	f
b63ad091-d68c-4498-a443-e988c1e52c71	be052828-d692-4365-9477-e2a3483d3009	2031-02-15	f
37225c36-e774-4cb2-ae58-eacf1b7a8045	be052828-d692-4365-9477-e2a3483d3009	2031-03-17	f
\.


--
-- Data for Name: topics; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.topics (id, user_id, title, created_at, revision_intervals, repeat_interval) FROM stdin;
be052828-d692-4365-9477-e2a3483d3009	92ceffd8-f0a5-41c9-bbf1-c77504e0e509	abc	2026-04-10	\N	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, hashed_password, created_at, revision_intervals, repeat_interval) FROM stdin;
92ceffd8-f0a5-41c9-bbf1-c77504e0e509	abc@gmail.com	$2b$12$iJzkf6qVUXYi6DUScq09De.cSEQg91HZzEHMP4bjZ03JF/BIkBf8K	2026-04-10	\N	\N
\.


--
-- Name: account account_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (id);


--
-- Name: invitation invitation_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT invitation_pkey PRIMARY KEY (id);


--
-- Name: jwks jwks_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.jwks
    ADD CONSTRAINT jwks_pkey PRIMARY KEY (id);


--
-- Name: member member_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT member_pkey PRIMARY KEY (id);


--
-- Name: organization organization_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.organization
    ADD CONSTRAINT organization_pkey PRIMARY KEY (id);


--
-- Name: organization organization_slug_key; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.organization
    ADD CONSTRAINT organization_slug_key UNIQUE (slug);


--
-- Name: project_config project_config_endpoint_id_key; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.project_config
    ADD CONSTRAINT project_config_endpoint_id_key UNIQUE (endpoint_id);


--
-- Name: project_config project_config_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.project_config
    ADD CONSTRAINT project_config_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (id);


--
-- Name: session session_token_key; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT session_token_key UNIQUE (token);


--
-- Name: user user_email_key; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: verification verification_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.verification
    ADD CONSTRAINT verification_pkey PRIMARY KEY (id);


--
-- Name: revisions revisions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.revisions
    ADD CONSTRAINT revisions_pkey PRIMARY KEY (id);


--
-- Name: topics topics_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT topics_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: account_userId_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX "account_userId_idx" ON neon_auth.account USING btree ("userId");


--
-- Name: invitation_email_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX invitation_email_idx ON neon_auth.invitation USING btree (email);


--
-- Name: invitation_organizationId_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX "invitation_organizationId_idx" ON neon_auth.invitation USING btree ("organizationId");


--
-- Name: member_organizationId_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX "member_organizationId_idx" ON neon_auth.member USING btree ("organizationId");


--
-- Name: member_userId_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX "member_userId_idx" ON neon_auth.member USING btree ("userId");


--
-- Name: organization_slug_uidx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE UNIQUE INDEX organization_slug_uidx ON neon_auth.organization USING btree (slug);


--
-- Name: session_userId_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX "session_userId_idx" ON neon_auth.session USING btree ("userId");


--
-- Name: verification_identifier_idx; Type: INDEX; Schema: neon_auth; Owner: neon_auth
--

CREATE INDEX verification_identifier_idx ON neon_auth.verification USING btree (identifier);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: account account_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.account
    ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: invitation invitation_inviterId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: invitation invitation_organizationId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES neon_auth.organization(id) ON DELETE CASCADE;


--
-- Name: member member_organizationId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES neon_auth.organization(id) ON DELETE CASCADE;


--
-- Name: member member_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: session session_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: neon_auth
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: revisions revisions_topic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.revisions
    ADD CONSTRAINT revisions_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.topics(id);


--
-- Name: topics topics_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT topics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict nbKfnnmCkxS1dmaNkNH5KTzMi9hfQozeEwzKVFZbRtqPwVjYcZNyRtvVmpAZdO2

