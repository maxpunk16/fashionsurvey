import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { db } from "./fbcfg";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import "./surveypg.css";

// ============================================================
// OPTIONS — mirrors the Firestore document fields
// ============================================================

const AGE_GROUPS = ["Under 18", "18-24", "25-34", "35-44", "45+"];
const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];
const OCCUPATIONS = ["Student", "Working Professional", "Freelancer", "Business Owner", "Homemaker", "Other"];
const SHOPPING_MODES = ["Online", "Offline", "Both"];
const SHOPPING_FREQUENCIES = ["Weekly", "Bi-Weekly", "Monthly", "Quarterly", "Rarely"];
const SHOPPING_SEASONS = ["Summer", "Winter", "Monsoon", "Spring", "All Seasons"];
const SHOPPING_TIMES = ["Morning", "Afternoon", "Evening", "Late Night (Online)"];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const FITS = ["Slim", "Regular", "Oversized", "Tailored"];
const PURCHASE_FACTORS = ["Price", "Brand", "Quality", "Trend", "Comfort"];
const DISCOUNT_PREFS = ["10%", "20%", "30%", "40%", "50%+"];
const BUDGET_OPTIONS = ["Below ₹1000", "₹1000-₹2000", "₹2000-₹5000", "₹5000-₹10000", "Above ₹10000"];
const TREND_FOLLOW = ["Always", "Often", "Sometimes", "Rarely", "Never"];
const TREND_SPEEDS = ["Immediately", "Within a Week", "Within a Month", "After a Few Months"];
const TREND_SOURCES = ["Instagram", "Pinterest", "YouTube", "TikTok", "Fashion Blogs", "Friends", "Magazines"];
const STOCK_BEHAVIORS = ["Wait for Restock", "Buy Similar Product", "Buy from Another Brand", "Skip Purchase"];
const REVISIT_REASONS = ["New Collection", "Discounts", "Quality Service", "Brand Loyalty", "Recommendations"];
const BRAND_REASONS = ["Quality", "Comfort", "Affordability", "Style", "Sustainability"];

const BRAND_OPTIONS = ["H&M", "Zara", "Nike", "Adidas", "Roadster", "Levi's", "Puma", "Allen Solly", "Van Heusen", "USPA", "Bewakoof", "Uniqlo"];
const CATEGORY_OPTIONS = ["T-Shirts", "Shirts", "Jeans", "Trousers", "Dresses", "Kurtas", "Jackets", "Hoodies", "Activewear", "Ethnic Wear"];
const COLOR_OPTIONS = ["Black", "White", "Blue", "Red", "Green", "Beige", "Pink", "Grey", "Brown", "Navy"];
const PRODUCT_OPTIONS = ["T-Shirts", "Shirts", "Jeans", "Trousers", "Dresses", "Kurtas", "Jackets", "Hoodies", "Shorts", "Skirts"];
const SUMMER_OPTIONS = ["T-Shirts", "Shorts", "Dresses", "Linen Shirts", "Tank Tops", "Skirts", "Cotton Kurtas"];
const WINTER_OPTIONS = ["Jackets", "Hoodies", "Sweaters", "Thermals", "Boots", "Scarves", "Trench Coats"];


// ============================================================
// REUSABLE: chip multi-select
// ============================================================

function ChipSelect({ options, selected, onChange, allowCustom }) {
  const [custom, setCustom] = useState("");

  const toggle = (val) => {
    onChange(
      selected.includes(val)
        ? selected.filter((v) => v !== val)
        : [...selected, val]
    );
  };

  const addCustom = () => {
    const val = custom.trim();
    if (val && !selected.includes(val)) {
      onChange([...selected, val]);
    }
    setCustom("");
  };

  return (
    <>
      <div className="chip-grid">
        {options.map((opt) => (
          <button
            type="button"
            key={opt}
            className={`chip ${selected.includes(opt) ? "selected" : ""}`}
            onClick={() => toggle(opt)}
          >
            {opt}
          </button>
        ))}
      </div>

      {allowCustom && (
        <div className="chip-custom-row">
          <input
            className="survey-input"
            placeholder="Add your own…"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
          />
          <button type="button" className="chip-add-btn" onClick={addCustom}>
            + Add
          </button>
        </div>
      )}
    </>
  );
}


// ============================================================
// MAIN COMPONENT
// ============================================================

export default function SurveyPage() {
  // --- form state ---
  const [form, setForm] = useState({
    name: "",
    ageGroup: "",
    gender: "",
    occupation: "",
    city: "",
    locality: "",
    shoppingMode: "",
    shoppingFrequency: "",
    shoppingSeason: "",
    shoppingTime: "",
    preferredSize: "",
    preferredFit: "",
    purchaseFactor: "",
    discountPreference: "",
    monthlyBudget: "",
    trendFollower: "",
    trendPurchaseSpeed: "",
    trendSource: "",
    outOfStockBehaviour: "",
    revisitReason: "",
    brandReason: "",
    nextColor: "",
    favoriteBrands: [],
    favoriteCategories: [],
    favoriteColors: [],
    nextPurchase: [],
    summerProducts: [],
    winterProducts: [],
    leastPurchased: [],
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // --- helpers ---
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const setChips = (key) => (val) => setForm({ ...form, [key]: val });

  // progress %
  const progress = useMemo(() => {
    const fields = Object.values(form);
    const filled = fields.filter((v) =>
      Array.isArray(v) ? v.length > 0 : v !== ""
    ).length;
    return Math.round((filled / fields.length) * 100);
  }, [form]);

  // --- submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, "FashionSurvey"), {
        ...form,
        submittedAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Submit failed:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- success ---
  if (submitted) {
    return (
      <div className="survey-page">
        <div className="survey-success-overlay">
          <div className="survey-success-card">
            <span className="success-icon">🎉</span>
            <h2>Thank You!</h2>
            <p>
              Your fashion preferences have been saved. We'll use this to
              curate a better experience for you!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- render ---
  return (
    <div className="survey-page">
      {/* decorative blobs */}
      <div className="survey-deco survey-deco-1" />
      <div className="survey-deco survey-deco-2" />
      <div className="survey-deco survey-deco-3" />

      {/* progress */}
      <div className="survey-progress-wrap">
        <div className="survey-progress-inner">
          <div className="survey-progress-bar">
            <div
              className="survey-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="survey-progress-label">{progress}%</span>
        </div>
      </div>

      {/* hero */}
      <div className="survey-hero">
        <div className="survey-hero-top flex items-center justify-between gap-4">
          <div className="survey-hero-badge">✦ Fashion Survey</div>
          <Link to="/admin" className="admin-access-btn">
            🔑 Admin Access
          </Link>
        </div>
        <h1>Tell Us Your Style</h1>
        <p>
          Help us understand your fashion preferences so we can curate a
          shopping experience made just for you.
        </p>
      </div>

      {/* masonry form */}
      <form onSubmit={handleSubmit}>
        <div className="survey-masonry">

          {/* ---- Card 1: About You ---- */}
          <div className="survey-card survey-card--coral">
            <div className="survey-card-header">
              <div className="survey-card-icon coral">👤</div>
              <div>
                <h3>About You</h3>
                <span className="card-subtitle">Let's get to know you</span>
              </div>
            </div>

            <div className="survey-field">
              <label>Your Name</label>
              <input
                className="survey-input"
                placeholder="e.g. Shreyan"
                value={form.name}
                onChange={set("name")}
              />
            </div>

            <div className="survey-field">
              <label>Age Group</label>
              <select className="survey-select" value={form.ageGroup} onChange={set("ageGroup")}>
                <option value="">Select…</option>
                {AGE_GROUPS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>

            <div className="survey-field">
              <label>Gender</label>
              <select className="survey-select" value={form.gender} onChange={set("gender")}>
                <option value="">Select…</option>
                {GENDERS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>

            <div className="survey-field">
              <label>Occupation</label>
              <select className="survey-select" value={form.occupation} onChange={set("occupation")}>
                <option value="">Select…</option>
                {OCCUPATIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* ---- Card 2: Location ---- */}
          <div className="survey-card survey-card--sage">
            <div className="survey-card-header">
              <div className="survey-card-icon sage">📍</div>
              <div>
                <h3>Your Location</h3>
                <span className="card-subtitle">Where do you shop from?</span>
              </div>
            </div>

            <div className="survey-field">
              <label>City</label>
              <input
                className="survey-input"
                placeholder="e.g. Kolkata"
                value={form.city}
                onChange={set("city")}
              />
            </div>

            <div className="survey-field">
              <label>Locality</label>
              <input
                className="survey-input"
                placeholder="e.g. Shyamnagar"
                value={form.locality}
                onChange={set("locality")}
              />
            </div>
          </div>

          {/* ---- Card 3: Shopping Habits ---- */}
          <div className="survey-card survey-card--lavender">
            <div className="survey-card-header">
              <div className="survey-card-icon lavender">🛍️</div>
              <div>
                <h3>Shopping Habits</h3>
                <span className="card-subtitle">How do you shop?</span>
              </div>
            </div>

            <div className="survey-field">
              <label>Shopping Mode</label>
              <select className="survey-select" value={form.shoppingMode} onChange={set("shoppingMode")}>
                <option value="">Select…</option>
                {SHOPPING_MODES.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>

            <div className="survey-field">
              <label>Shopping Frequency</label>
              <select className="survey-select" value={form.shoppingFrequency} onChange={set("shoppingFrequency")}>
                <option value="">Select…</option>
                {SHOPPING_FREQUENCIES.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>

            <div className="survey-field">
              <label>Preferred Season</label>
              <select className="survey-select" value={form.shoppingSeason} onChange={set("shoppingSeason")}>
                <option value="">Select…</option>
                {SHOPPING_SEASONS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>

            <div className="survey-field">
              <label>Shopping Time</label>
              <select className="survey-select" value={form.shoppingTime} onChange={set("shoppingTime")}>
                <option value="">Select…</option>
                {SHOPPING_TIMES.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* ---- Card 4: Size & Fit ---- */}
          <div className="survey-card survey-card--blush">
            <div className="survey-card-header">
              <div className="survey-card-icon blush">📏</div>
              <div>
                <h3>Size & Fit</h3>
                <span className="card-subtitle">What fits you best?</span>
              </div>
            </div>

            <div className="survey-field">
              <label>Preferred Size</label>
              <div className="chip-grid">
                {SIZES.map((s) => (
                  <button
                    type="button"
                    key={s}
                    className={`chip ${form.preferredSize === s ? "selected" : ""}`}
                    onClick={() => setForm({ ...form, preferredSize: s })}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="survey-field">
              <label>Preferred Fit</label>
              <div className="chip-grid">
                {FITS.map((f) => (
                  <button
                    type="button"
                    key={f}
                    className={`chip ${form.preferredFit === f ? "selected" : ""}`}
                    onClick={() => setForm({ ...form, preferredFit: f })}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ---- Card 5: Brands ---- */}
          <div className="survey-card survey-card--sky">
            <div className="survey-card-header">
              <div className="survey-card-icon sky">🏷️</div>
              <div>
                <h3>Favourite Brands</h3>
                <span className="card-subtitle">Pick all that you love</span>
              </div>
            </div>

            <div className="survey-field">
              <label>Brands</label>
              <ChipSelect
                options={BRAND_OPTIONS}
                selected={form.favoriteBrands}
                onChange={setChips("favoriteBrands")}
                allowCustom
              />
            </div>

            <div className="survey-field">
              <label>Why this brand?</label>
              <select className="survey-select" value={form.brandReason} onChange={set("brandReason")}>
                <option value="">Select…</option>
                {BRAND_REASONS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* ---- Card 6: Categories & Colors ---- */}
          <div className="survey-card survey-card--sand">
            <div className="survey-card-header">
              <div className="survey-card-icon sand">🎨</div>
              <div>
                <h3>Categories & Colors</h3>
                <span className="card-subtitle">Your style DNA</span>
              </div>
            </div>

            <div className="survey-field">
              <label>Favourite Categories</label>
              <ChipSelect
                options={CATEGORY_OPTIONS}
                selected={form.favoriteCategories}
                onChange={setChips("favoriteCategories")}
                allowCustom
              />
            </div>

            <div className="survey-field">
              <label>Favourite Colors</label>
              <ChipSelect
                options={COLOR_OPTIONS}
                selected={form.favoriteColors}
                onChange={setChips("favoriteColors")}
              />
            </div>

            <div className="survey-field">
              <label>Next Color You Want to Try</label>
              <select className="survey-select" value={form.nextColor} onChange={set("nextColor")}>
                <option value="">Select…</option>
                {COLOR_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* ---- Card 7: Purchase Plans ---- */}
          <div className="survey-card survey-card--coral">
            <div className="survey-card-header">
              <div className="survey-card-icon coral">🛒</div>
              <div>
                <h3>Purchase Plans</h3>
                <span className="card-subtitle">What's next on your list?</span>
              </div>
            </div>

            <div className="survey-field">
              <label>Next Purchase</label>
              <ChipSelect
                options={PRODUCT_OPTIONS}
                selected={form.nextPurchase}
                onChange={setChips("nextPurchase")}
              />
            </div>

            <div className="survey-field">
              <label>Least Purchased</label>
              <ChipSelect
                options={PRODUCT_OPTIONS}
                selected={form.leastPurchased}
                onChange={setChips("leastPurchased")}
              />
            </div>

            <div className="survey-field">
              <label>Key Purchase Factor</label>
              <select className="survey-select" value={form.purchaseFactor} onChange={set("purchaseFactor")}>
                <option value="">Select…</option>
                {PURCHASE_FACTORS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* ---- Card 8: Seasonal ---- */}
          <div className="survey-card survey-card--sage">
            <div className="survey-card-header">
              <div className="survey-card-icon sage">🌦️</div>
              <div>
                <h3>Seasonal Picks</h3>
                <span className="card-subtitle">Summer vs Winter wardrobe</span>
              </div>
            </div>

            <div className="survey-field">
              <label>Summer Essentials</label>
              <ChipSelect
                options={SUMMER_OPTIONS}
                selected={form.summerProducts}
                onChange={setChips("summerProducts")}
              />
            </div>

            <div className="survey-field">
              <label>Winter Must-Haves</label>
              <ChipSelect
                options={WINTER_OPTIONS}
                selected={form.winterProducts}
                onChange={setChips("winterProducts")}
              />
            </div>
          </div>

          {/* ---- Card 9: Budget & Discounts ---- */}
          <div className="survey-card survey-card--blush">
            <div className="survey-card-header">
              <div className="survey-card-icon blush">💰</div>
              <div>
                <h3>Budget & Discounts</h3>
                <span className="card-subtitle">Your spending style</span>
              </div>
            </div>

            <div className="survey-field">
              <label>Monthly Budget</label>
              <select className="survey-select" value={form.monthlyBudget} onChange={set("monthlyBudget")}>
                <option value="">Select…</option>
                {BUDGET_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>

            <div className="survey-field">
              <label>Preferred Discount</label>
              <div className="chip-grid">
                {DISCOUNT_PREFS.map((d) => (
                  <button
                    type="button"
                    key={d}
                    className={`chip ${form.discountPreference === d ? "selected" : ""}`}
                    onClick={() => setForm({ ...form, discountPreference: d })}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="survey-field">
              <label>Out-of-Stock Behaviour</label>
              <select className="survey-select" value={form.outOfStockBehaviour} onChange={set("outOfStockBehaviour")}>
                <option value="">Select…</option>
                {STOCK_BEHAVIORS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* ---- Card 10: Trends ---- */}
          <div className="survey-card survey-card--lavender">
            <div className="survey-card-header">
              <div className="survey-card-icon lavender">📱</div>
              <div>
                <h3>Trends & Inspiration</h3>
                <span className="card-subtitle">Stay ahead of the curve</span>
              </div>
            </div>

            <div className="survey-field">
              <label>Do You Follow Trends?</label>
              <div className="chip-grid">
                {TREND_FOLLOW.map((t) => (
                  <button
                    type="button"
                    key={t}
                    className={`chip ${form.trendFollower === t ? "selected" : ""}`}
                    onClick={() => setForm({ ...form, trendFollower: t })}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="survey-field">
              <label>How Fast Do You Buy Trending Items?</label>
              <select className="survey-select" value={form.trendPurchaseSpeed} onChange={set("trendPurchaseSpeed")}>
                <option value="">Select…</option>
                {TREND_SPEEDS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>

            <div className="survey-field">
              <label>Trend Source</label>
              <select className="survey-select" value={form.trendSource} onChange={set("trendSource")}>
                <option value="">Select…</option>
                {TREND_SOURCES.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>

            <div className="survey-field">
              <label>What Brings You Back?</label>
              <select className="survey-select" value={form.revisitReason} onChange={set("revisitReason")}>
                <option value="">Select…</option>
                {REVISIT_REASONS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* submit */}
        <div className="survey-submit-wrap">
          <button
            type="submit"
            className="survey-submit-btn"
            disabled={submitting}
          >
            {submitting ? "Submitting…" : "Submit My Style ✦"}
          </button>
        </div>
      </form>
    </div>
  );
}
