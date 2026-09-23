import { createFileRoute } from "@tanstack/react-router";
import { PublishedOr } from "../components/page-builder/published-page";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "../components/layout/page-shell";
import { PageIntro } from "../components/layout/page-intro";
import { Reveal } from "../components/motion/primitives";
import { services } from "../content/services";
import { site } from "../content/site";
import { track } from "../lib/analytics";
import { submitWebsiteEnquiry } from "../lib/website-capture";
import { breadcrumbSchema } from "../lib/seo/json-ld";
import {
  buildMailUrl,
  buildTelUrl,
  buildWhatsAppUrl,
} from "../lib/whatsapp/url-builder";
import { detailedEnquiryMessage } from "../lib/whatsapp/templates";
import { useSiteContact } from "../hooks/use-site-contact";

const TITLE = "Tell us what your family needs";
const DESCRIPTION =
  "Send one message with the details. We reply with the plan, who will go and what it will cost.";

/** Same schema for the field rules and the message we compose. */
const enquirySchema = z.object({
  name: z.string().trim().min(2, "Please write your name"),
  phone: z.string().trim().min(6, "Please write a number we can reach you on"),
  livingIn: z.string().trim().max(80).optional(),
  familyCity: z.string().trim().max(80).optional(),
  service: z.string().trim().min(1, "Please choose what you need"),
  urgency: z.string().trim().min(1),
  message: z.string().trim().max(1000).optional(),
  /** Hidden field. Real people leave it empty; bots fill it. */
  website: z.string().max(0).optional(),
});

type EnquiryValues = z.infer<typeof enquirySchema>;

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: `${TITLE} — ${site.brand.name}` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/contact" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "Talk to us", url: "/contact" },
          ]),
        ),
      },
    ],
  }),
  component: ContactPageRoute,
});

const FIELD =
  "mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring";

function ContactPage() {
  const contact = useSiteContact();
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EnquiryValues>({
    resolver: zodResolver(enquirySchema),
    defaultValues: { urgency: "In the next few days", service: "" },
  });

  const telUrl = buildTelUrl(contact.phone);
  const mailUrl = buildMailUrl(contact.email, "Help for my family in India");
  const plainWhatsapp = buildWhatsAppUrl(contact.whatsapp, detailedEnquiryMessage({}));

  async function onSubmit(values: EnquiryValues) {
    if (values.website) return; // honeypot tripped, fail silently

    // The lead is recorded first, so a messaging failure never loses the enquiry.
    await submitWebsiteEnquiry({
      name: values.name,
      phone: values.phone,
      city: values.familyCity ?? "",
      need: values.message ?? values.service,
      serviceInterest: values.service,
    }).catch(() => undefined);

    const message = detailedEnquiryMessage(values);
    const url = buildWhatsAppUrl(contact.whatsapp, message);
    setSent(true);

    if (url) {
      track("whatsapp.clicked", { placement: "contact-form", service: values.service });
      window.open(url, "_blank", "noopener,noreferrer");
      toast.success("Opening WhatsApp with your details filled in.");
    } else {
      toast.success("Thank you. We have your request and will come back to you.");
    }
  }

  return (
    <PageShell pageName="contact">
      <PageIntro
        eyebrow="Talk to us"
        title={TITLE}
        lead={DESCRIPTION}
        trail={[
          { label: "Home", href: "/" },
          { label: "Talk to us", href: "/contact" },
        ]}
      />

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-14 lg:grid-cols-[1.2fr_1fr]">
        <Reveal>
          <form
            onSubmit={handleSubmit(onSubmit)}
            onFocus={() => track("form.started", { form: "contact" })}
            className="rounded-3xl border border-border bg-card p-6 sm:p-8"
            noValidate
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="text-sm font-semibold">
                  Your name
                </label>
                <input id="name" className={FIELD} autoComplete="name" {...register("name")} />
                {errors.name ? (
                  <p role="alert" className="mt-1 text-sm text-destructive">
                    {errors.name.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="phone" className="text-sm font-semibold">
                  Your number (with country code)
                </label>
                <input
                  id="phone"
                  className={FIELD}
                  inputMode="tel"
                  autoComplete="tel"
                  {...register("phone")}
                />
                {errors.phone ? (
                  <p role="alert" className="mt-1 text-sm text-destructive">
                    {errors.phone.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="livingIn" className="text-sm font-semibold">
                  Where you live
                </label>
                <input
                  id="livingIn"
                  className={FIELD}
                  placeholder="Dubai, Doha, Riyadh…"
                  {...register("livingIn")}
                />
              </div>

              <div>
                <label htmlFor="familyCity" className="text-sm font-semibold">
                  Where your family lives
                </label>
                <input
                  id="familyCity"
                  className={FIELD}
                  placeholder="City or town in India"
                  {...register("familyCity")}
                />
              </div>

              <div>
                <label htmlFor="service" className="text-sm font-semibold">
                  What do you need?
                </label>
                <select id="service" className={FIELD} {...register("service")}>
                  <option value="">Choose one</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.title}>
                      {service.title}
                    </option>
                  ))}
                  <option value="Something else">Something else</option>
                </select>
                {errors.service ? (
                  <p role="alert" className="mt-1 text-sm text-destructive">
                    {errors.service.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="urgency" className="text-sm font-semibold">
                  How soon?
                </label>
                <select id="urgency" className={FIELD} {...register("urgency")}>
                  <option>Today — it is urgent</option>
                  <option>In the next few days</option>
                  <option>This month</option>
                  <option>Just asking for now</option>
                </select>
              </div>
            </div>

            <div className="mt-5">
              <label htmlFor="message" className="text-sm font-semibold">
                Tell us a little more
              </label>
              <textarea id="message" rows={4} className={FIELD} {...register("message")} />
            </div>

            <div aria-hidden="true" className="hidden">
              <label htmlFor="website">Leave this empty</label>
              <input id="website" tabIndex={-1} autoComplete="off" {...register("website")} />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-semibold text-primary-foreground disabled:opacity-60 sm:w-auto"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              {isSubmitting ? "Sending…" : "Send my request"}
            </button>

            {sent ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Thank you. If WhatsApp did not open, use the buttons on the right and we will
                still have your request.
              </p>
            ) : null}
          </form>
        </Reveal>

        <Reveal delay={80}>
          <div className="rounded-3xl border border-border bg-accent/40 p-6 sm:p-8">
            <h2 className="font-display text-xl font-bold">Other ways to reach us</h2>
            <ul className="mt-4 space-y-3">
              {plainWhatsapp ? (
                <li>
                  <a
                    href={plainWhatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track("whatsapp.clicked", { placement: "contact-side" })}
                    className="flex min-h-[48px] items-center gap-3 rounded-2xl bg-background px-4 font-semibold"
                  >
                    <MessageCircle className="h-5 w-5 text-primary" aria-hidden="true" />
                    {site.cta.whatsapp}
                  </a>
                </li>
              ) : null}
              {telUrl ? (
                <li>
                  <a
                    href={telUrl}
                    onClick={() => track("phone.clicked", { placement: "contact-side" })}
                    className="flex min-h-[48px] items-center gap-3 rounded-2xl bg-background px-4 font-semibold"
                  >
                    <Phone className="h-5 w-5 text-primary" aria-hidden="true" />
                    {contact.phone}
                  </a>
                </li>
              ) : null}
              {mailUrl ? (
                <li>
                  <a
                    href={mailUrl}
                    onClick={() => track("email.clicked", { placement: "contact-side" })}
                    className="flex min-h-[48px] items-center gap-3 rounded-2xl bg-background px-4 font-semibold"
                  >
                    <Mail className="h-5 w-5 text-primary" aria-hidden="true" />
                    {contact.email}
                  </a>
                </li>
              ) : null}
              {contact.location ? (
                <li className="flex items-start gap-3 rounded-2xl bg-background px-4 py-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" />
                  <span>{contact.location}</span>
                </li>
              ) : null}
            </ul>
            <p className="mt-5 text-sm text-muted-foreground">{site.hours}</p>
          </div>
        </Reveal>
      </section>
    </PageShell>
  );
}

function ContactPageRoute() {
  return (
    <PublishedOr page="contact" pageName="contact">
      <ContactPage />
    </PublishedOr>
  );
}
