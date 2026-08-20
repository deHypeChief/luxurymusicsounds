import { Check, ExternalLink, Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AdminHeader } from '../../components/admin/AdminLayout'
import { ErrorState, Spinner } from '../../components/States'
import { adminApi, clearSiteSettingsCache } from '../../lib/api'
import { BRANDS } from '../../lib/format'

const PLATFORMS = ['Instagram', 'TikTok', 'Threads', 'Facebook', 'YouTube', 'X', 'LinkedIn']

const BLANK_SOCIAL = {
  brand: 'Luxury Music Sounds',
  platform: 'Instagram',
  handle: '',
  url: '',
  sortOrder: 0,
}

export default function AdminSettings() {
  const [form, setForm] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [justSaved, setJustSaved] = useState(false)

  const load = () => {
    setLoadError(null)
    adminApi
      .settings()
      .then((data) =>
        setForm({
          contact: { ...data.contact },
          footerHeading: data.footerHeading ?? '',
          footerIntro: data.footerIntro ?? '',
          socials: (data.socials ?? []).map((social) => ({ ...social })),
        }),
      )
      .catch(setLoadError)
  }

  useEffect(load, [])

  const update = (patch) => {
    setForm((current) => ({ ...current, ...patch }))
    setJustSaved(false)
  }

  const updateSocial = (index, patch) => {
    setForm((current) => ({
      ...current,
      socials: current.socials.map((social, position) =>
        position === index ? { ...social, ...patch } : social,
      ),
    }))
    setJustSaved(false)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setSaveError(null)
    setFieldErrors({})

    try {
      await adminApi.updateSettings({
        contact: form.contact,
        footerHeading: form.footerHeading,
        footerIntro: form.footerIntro,
        socials: form.socials
          .filter((social) => social.url.trim())
          .map((social, index) => ({
            brand: social.brand,
            platform: social.platform.trim(),
            handle: social.handle.trim(),
            url: social.url.trim(),
            sortOrder: index,
          })),
      })

      // The public site caches settings for the session; drop it so the change
      // shows up without a hard reload.
      clearSiteSettingsCache()

      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2600)
      load()
    } catch (caught) {
      setSaveError(caught.message)
      setFieldErrors(caught.fieldErrors ?? {})
    } finally {
      setIsSaving(false)
    }
  }

  if (loadError) return <ErrorState error={loadError} onRetry={load} />
  if (!form) return <Spinner label="Loading settings" />

  return (
    <>
      <AdminHeader
        title="Settings"
        description="The contact details and social links shown in the footer and on the About page."
      />

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_1.25fr]">
        <div className="space-y-6">
          <section className="surface p-6">
            <h2 className="mb-1 font-display text-xl font-semibold">Contact</h2>
            <p className="mb-5 text-xs text-ivory-faint">
              Shown in the footer and as the enquiry buttons on the About page. Leave a field
              empty and it is hidden rather than shown blank.
            </p>

            <div className="space-y-4">
              <div>
                <label className="field-label" htmlFor="contact-email">
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  className="field"
                  value={form.contact.email}
                  onChange={(event) =>
                    update({ contact: { ...form.contact, email: event.target.value } })
                  }
                  placeholder="bookings@luxurymusicsounds.com"
                />
                {fieldErrors['contact.email'] ? (
                  <p className="mt-1.5 text-xs text-velvet-lift">{fieldErrors['contact.email']}</p>
                ) : null}
              </div>

              <div>
                <label className="field-label" htmlFor="contact-phone">
                  Phone
                </label>
                <input
                  id="contact-phone"
                  className="field"
                  value={form.contact.phone}
                  onChange={(event) =>
                    update({ contact: { ...form.contact, phone: event.target.value } })
                  }
                  placeholder="+234 800 000 0000"
                />
              </div>

              <div>
                <label className="field-label" htmlFor="contact-city">
                  Location
                </label>
                <input
                  id="contact-city"
                  className="field"
                  value={form.contact.city}
                  onChange={(event) =>
                    update({ contact: { ...form.contact, city: event.target.value } })
                  }
                  placeholder="Lagos, Nigeria"
                />
              </div>
            </div>
          </section>

          <section className="surface p-6">
            <h2 className="mb-5 font-display text-xl font-semibold">Footer copy</h2>

            <div className="space-y-4">
              <div>
                <label className="field-label" htmlFor="footer-heading">
                  Heading
                </label>
                <input
                  id="footer-heading"
                  className="field"
                  value={form.footerHeading}
                  onChange={(event) => update({ footerHeading: event.target.value })}
                  placeholder="Book the room"
                />
                <p className="mt-1.5 text-xs text-ivory-faint">
                  The last word is set in the gold script face, so put the word you want
                  emphasised at the end.
                </p>
              </div>

              <div>
                <label className="field-label" htmlFor="footer-intro">
                  Paragraph
                </label>
                <textarea
                  id="footer-intro"
                  className="field min-h-32 resize-y"
                  value={form.footerIntro}
                  onChange={(event) => update({ footerIntro: event.target.value })}
                />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="surface p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold">Social links</h2>
                <p className="mt-1 text-xs text-ivory-faint">
                  Grouped by act in the footer, in the order listed here.
                </p>
              </div>
              <button
                type="button"
                onClick={() => update({ socials: [...form.socials, { ...BLANK_SOCIAL }] })}
                className="btn btn-gold btn-sm shrink-0"
              >
                <Plus size={13} strokeWidth={1.5} />
                Add
              </button>
            </div>

            {form.socials.length === 0 ? (
              <p className="text-sm text-ivory-faint">
                No links yet. Add one and it appears in the footer straight away.
              </p>
            ) : (
              <ul className="space-y-3">
                {form.socials.map((social, index) => (
                  <li key={index} className="border border-ink-line p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="field-label" htmlFor={`social-brand-${index}`}>
                          Act
                        </label>
                        <select
                          id={`social-brand-${index}`}
                          className="field"
                          value={social.brand}
                          onChange={(event) => updateSocial(index, { brand: event.target.value })}
                        >
                          {BRANDS.map((brand) => (
                            <option key={brand} value={brand}>
                              {brand}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="field-label" htmlFor={`social-platform-${index}`}>
                          Platform
                        </label>
                        <input
                          id={`social-platform-${index}`}
                          className="field"
                          list="social-platforms"
                          value={social.platform}
                          onChange={(event) =>
                            updateSocial(index, { platform: event.target.value })
                          }
                        />
                      </div>

                      <div>
                        <label className="field-label" htmlFor={`social-handle-${index}`}>
                          Handle
                        </label>
                        <input
                          id={`social-handle-${index}`}
                          className="field"
                          value={social.handle}
                          onChange={(event) => updateSocial(index, { handle: event.target.value })}
                          placeholder="@easystrings"
                        />
                      </div>

                      <div>
                        <label className="field-label" htmlFor={`social-url-${index}`}>
                          Link
                        </label>
                        <input
                          id={`social-url-${index}`}
                          type="url"
                          className="field"
                          value={social.url}
                          onChange={(event) => updateSocial(index, { url: event.target.value })}
                          placeholder="https://instagram.com/easystrings"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-4">
                      {social.url ? (
                        <a
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-ivory-faint transition-colors hover:text-gold-lift"
                        >
                          <ExternalLink size={12} strokeWidth={1.5} />
                          Open to check
                        </a>
                      ) : (
                        <span className="text-xs text-ivory-faint">
                          A link is required, or this row is dropped on save.
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          update({
                            socials: form.socials.filter((_, position) => position !== index),
                          })
                        }
                        className="flex items-center gap-1.5 text-xs text-ivory-dim transition-colors hover:text-velvet-lift"
                      >
                        <Trash2 size={12} strokeWidth={1.5} />
                        Remove
                      </button>
                    </div>

                    {fieldErrors[`socials.${index}.url`] ? (
                      <p className="mt-2 text-xs text-velvet-lift">
                        {fieldErrors[`socials.${index}.url`]}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}

            <datalist id="social-platforms">
              {PLATFORMS.map((platform) => (
                <option key={platform} value={platform} />
              ))}
            </datalist>
          </section>

          <div className="surface p-6">
            {saveError ? (
              <p
                role="alert"
                className="mb-4 border border-velvet/50 bg-velvet-deep/25 p-3 text-sm"
              >
                {saveError}
              </p>
            ) : null}

            <button type="submit" className="btn btn-buy w-full" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 size={15} strokeWidth={1.5} className="animate-spin" />
                  Saving
                </>
              ) : justSaved ? (
                <>
                  <Check size={15} strokeWidth={1.5} />
                  Saved
                </>
              ) : (
                <>
                  <Save size={15} strokeWidth={1.5} />
                  Save settings
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </>
  )
}
