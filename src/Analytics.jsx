import React, { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,

} from "recharts";

import "./Analytics.css";


// ============================================================
// COLOR PALETTES
// ============================================================

const PALETTE = [
  "#818cf8", "#f472b6", "#34d399", "#fbbf24",
  "#60a5fa", "#f87171", "#a78bfa", "#2dd4bf",
  "#fb923c", "#e879f9", "#38bdf8", "#4ade80",
  "#facc15", "#f43f5e", "#8b5cf6", "#06b6d4",
];

const PIE_PALETTE = [
  "#818cf8", "#f472b6", "#34d399", "#fbbf24",
  "#60a5fa", "#f87171", "#a78bfa", "#2dd4bf",
];


// ============================================================
// CUSTOM TOOLTIP
// ============================================================

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: "rgba(15, 23, 42, 0.95)",
        border: "1px solid rgba(129, 140, 248, 0.25)",
        borderRadius: 10,
        padding: "12px 16px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
      }}
    >
      <p style={{ color: "#f1f5f9", fontWeight: 600, marginBottom: 4 }}>
        {label}
      </p>

      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color || "#cbd5e1", fontSize: 13 }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};


// ============================================================
// HELPERS
// ============================================================

const countValues = (data, field) => {
  const counts = {};

  data.forEach((item) => {
    const value = item[field];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      const key = String(value).trim();

      counts[key] = (counts[key] || 0) + 1;
    }
  });

  return Object.entries(counts)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => b.value - a.value);
};


// Cross-tabulation: returns { rows, columns, matrix }
const createCrosstab = (data, field1, field2) => {
  const matrix = {};
  const colSet = new Set();

  data.forEach((item) => {
    const v1 = item[field1];
    const v2 = item[field2];

    if (
      v1 != null && String(v1).trim() !== "" &&
      v2 != null && String(v2).trim() !== ""
    ) {
      const r = String(v1).trim();
      const c = String(v2).trim();

      if (!matrix[r]) matrix[r] = {};

      matrix[r][c] = (matrix[r][c] || 0) + 1;
      colSet.add(c);
    }
  });

  const rows = Object.keys(matrix).sort();
  const columns = [...colSet].sort();

  return { rows, columns, matrix };
};


// ============================================================
// REUSABLE CHART WRAPPERS
// ============================================================

const BarChartSection = ({
  title, description, data, height = 320,
  layout, sliceCount, angleX, barColor,
}) => (
  <div className="chart-card">
    <h2>{title}</h2>

    {description && (
      <p className="chart-description">{description}</p>
    )}

    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={sliceCount ? data.slice(0, sliceCount) : data}
        layout={layout}
        margin={
          layout === "vertical"
            ? { left: 60, right: 20 }
            : angleX
            ? { top: 20, right: 20, left: 10, bottom: 60 }
            : { top: 20, right: 20, left: 10, bottom: 10 }
        }
      >
        <CartesianGrid strokeDasharray="3 3" />

        {layout === "vertical" ? (
          <>
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={100} />
          </>
        ) : (
          <>
            <XAxis
              dataKey="name"
              angle={angleX || 0}
              textAnchor={angleX ? "end" : "middle"}
            />
            <YAxis />
          </>
        )}

        <Tooltip content={<CustomTooltip />} />

        <Bar
          dataKey="value"
          name="Customers"
          radius={
            layout === "vertical"
              ? [0, 6, 6, 0]
              : [6, 6, 0, 0]
          }
          fill={barColor || PALETTE[0]}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
);


const PieChartSection = ({ title, description, data, height = 320 }) => (
  <div className="chart-card">
    <h2>{title}</h2>

    {description && (
      <p className="chart-description">{description}</p>
    )}

    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label
        >
          {data.map((_, index) => (
            <Cell
              key={index}
              fill={PIE_PALETTE[index % PIE_PALETTE.length]}
            />
          ))}
        </Pie>

        <Tooltip content={<CustomTooltip />} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  </div>
);


// Heatmap table for cross analysis
const HeatmapTable = ({ title, description, crosstab }) => {
  if (!crosstab || crosstab.rows.length === 0) return null;

  const allValues = crosstab.rows.flatMap((r) =>
    crosstab.columns.map((c) => crosstab.matrix[r]?.[c] || 0)
  );

  const maxVal = Math.max(...allValues, 1);

  const getCellColor = (val) => {
    const intensity = val / maxVal;

    if (intensity === 0) return "transparent";

    return `rgba(129, 140, 248, ${0.1 + intensity * 0.7})`;
  };

  return (
    <div className="chart-card full">
      <h2>{title}</h2>

      {description && (
        <p className="chart-description">{description}</p>
      )}

      <div className="heatmap-wrapper">
        <table className="heatmap-table">
          <thead>
            <tr>
              <th></th>
              {crosstab.columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {crosstab.rows.map((row) => (
              <tr key={row}>
                <td>{row}</td>

                {crosstab.columns.map((col) => {
                  const val = crosstab.matrix[row]?.[col] || 0;

                  return (
                    <td key={col}>
                      <span
                        className="heatmap-cell"
                        style={{ background: getCellColor(val) }}
                      >
                        {val || "–"}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


// ============================================================
// MAIN COMPONENT
// ============================================================

export default function Analytics() {
  const [surveyData, setSurveyData] = useState([]);
  const [loading, setLoading] = useState(true);


  // ----------------------------------------------------------
  // FIREBASE REALTIME LISTENER
  // ----------------------------------------------------------

  useEffect(() => {
    fetch("/FashionSurveyResponses_100_Datasets.csv")
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            setSurveyData(results.data);
            setLoading(false);
          },
          error: (error) => {
            console.error("Error parsing CSV:", error);
            setLoading(false);
          },
        });
      })
      .catch((error) => {
        console.error("Error fetching CSV:", error);
        setLoading(false);
      });
  }, []);


  // ==========================================================
  // ANALYTICS  (mirrors fasionsurvey.py sections)
  // ==========================================================

  const analytics = useMemo(() => {

    const totalCustomers = surveyData.length;


    // --------------------------------------------------------
    // BASIC DISTRIBUTIONS (Sections 11-22 in Python)
    // --------------------------------------------------------

    const productDemand     = countValues(surveyData, "nextPurchase");
    const categoryDemand    = countValues(surveyData, "favoriteCategories");
    const brandDemand       = countValues(surveyData, "favoriteBrands");
    const sizeDemand        = countValues(surveyData, "preferredSize");
    const colorDemand       = countValues(surveyData, "nextColor");
    const fitDemand         = countValues(surveyData, "preferredFit");
    const shoppingMode      = countValues(surveyData, "shoppingMode");
    const gender            = countValues(surveyData, "gender");
    const ageGroup          = countValues(surveyData, "ageGroup");
    const city              = countValues(surveyData, "city");
    const season            = countValues(surveyData, "shoppingSeason");
    const purchaseFactor    = countValues(surveyData, "purchaseFactor");
    const stockBehavior     = countValues(surveyData, "outOfStockBehaviour");
    const shoppingFrequency = countValues(surveyData, "shoppingFrequency");
    const trendSource       = countValues(surveyData, "trendSource");

    // Additional fields from fasionsurvey.py
    const summerProducts     = countValues(surveyData, "summerProducts");
    const winterProducts     = countValues(surveyData, "winterProducts");
    const discountPreference = countValues(surveyData, "discountPreference");
    const occupation         = countValues(surveyData, "occupation");
    const locality           = countValues(surveyData, "locality");
    const trendFollower      = countValues(surveyData, "trendFollower");
    const shoppingTime       = countValues(surveyData, "shoppingTime");
    const revisitReason      = countValues(surveyData, "revisitReason");
    const brandReason        = countValues(surveyData, "brandReason");
    const leastPurchased     = countValues(surveyData, "leastPurchased");
    const trendPurchaseSpeed = countValues(surveyData, "trendPurchaseSpeed");
    const monthlyBudget      = countValues(surveyData, "monthlyBudget");
    const favoriteColors     = countValues(surveyData, "favoriteColors");


    // --------------------------------------------------------
    // CROSS ANALYSIS (Section 23 in Python)
    // --------------------------------------------------------

    const cityProduct    = createCrosstab(surveyData, "city", "nextPurchase");
    const ageProduct     = createCrosstab(surveyData, "ageGroup", "nextPurchase");
    const seasonProduct  = createCrosstab(surveyData, "shoppingSeason", "nextPurchase");
    const genderProduct  = createCrosstab(surveyData, "gender", "nextPurchase");


    // --------------------------------------------------------
    // STOCK RECOMMENDATIONS (Section 43 in Python)
    // --------------------------------------------------------

    const stockRecommendations = productDemand.map(
      (product) => {

        const percentage =
          totalCustomers > 0
            ? (product.value / totalCustomers) * 100
            : 0;

        let recommendation = "";

        if (percentage >= 15) {
          recommendation =
            "HIGH DEMAND — Increase stock";
        } else if (percentage >= 10) {
          recommendation =
            "MEDIUM DEMAND — Maintain stock";
        } else {
          recommendation =
            "LOW DEMAND — Monitor stock";
        }

        return {
          product: product.name,
          customers: product.value,
          percentage: percentage.toFixed(1),
          recommendation,
        };
      }
    );


    return {
      totalCustomers,
      productDemand,
      categoryDemand,
      brandDemand,
      sizeDemand,
      colorDemand,
      fitDemand,
      shoppingMode,
      gender,
      ageGroup,
      city,
      season,
      purchaseFactor,
      stockBehavior,
      shoppingFrequency,
      trendSource,
      summerProducts,
      winterProducts,
      discountPreference,
      occupation,
      locality,
      trendFollower,
      shoppingTime,
      revisitReason,
      brandReason,
      leastPurchased,
      trendPurchaseSpeed,
      monthlyBudget,
      favoriteColors,
      cityProduct,
      ageProduct,
      seasonProduct,
      genderProduct,
      stockRecommendations,
    };

  }, [surveyData]);


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loader"></div>
        <h2>Loading Analytics...</h2>
        <p>Fetching survey data from Firebase</p>
      </div>
    );
  }


  // ==========================================================
  // TOP VALUES
  // ==========================================================

  const topVal = (arr) => arr[0]?.name || "N/A";

  const mostDemandedProduct = topVal(analytics.productDemand);
  const mostPopularCategory = topVal(analytics.categoryDemand);
  const mostPopularBrand    = topVal(analytics.brandDemand);
  const mostPreferredSize   = topVal(analytics.sizeDemand);
  const mostPopularMode     = topVal(analytics.shoppingMode);
  const topColor            = topVal(analytics.colorDemand);
  const topFit              = topVal(analytics.fitDemand);
  const topTrendSource      = topVal(analytics.trendSource);


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="analytics-page">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <header className="analytics-header">

        <div>
          <p className="analytics-label">
            FASHION SURVEY
          </p>

          <h1>
            Business Analytics
          </h1>

          <p className="analytics-subtitle">
            Comprehensive customer behavior, product demand, cross-analysis &amp; stock insights
          </p>
        </div>

        <div className="live-status">
          <span></span>
          Live Data
        </div>

      </header>


      {/* ====================================================
          KPI CARDS
      ==================================================== */}

      <section className="kpi-grid">

        <div className="kpi-card">
          <div className="kpi-icon">👥</div>
          <div>
            <p>Total Customers</p>
            <h2>{analytics.totalCustomers}</h2>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">🛍️</div>
          <div>
            <p>Top Product</p>
            <h2>{mostDemandedProduct}</h2>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">👕</div>
          <div>
            <p>Top Category</p>
            <h2>{mostPopularCategory}</h2>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">🏷️</div>
          <div>
            <p>Top Brand</p>
            <h2>{mostPopularBrand}</h2>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">📏</div>
          <div>
            <p>Top Size</p>
            <h2>{mostPreferredSize}</h2>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">🎨</div>
          <div>
            <p>Top Color</p>
            <h2>{topColor}</h2>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">🛒</div>
          <div>
            <p>Shopping Mode</p>
            <h2>{mostPopularMode}</h2>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">📱</div>
          <div>
            <p>Trend Source</p>
            <h2>{topTrendSource}</h2>
          </div>
        </div>

      </section>


      {/* ====================================================
          SECTION: PRODUCT DEMAND
      ==================================================== */}

      <div className="section-divider">
        <h2>📊 Product Demand Analysis</h2>
      </div>

      <section className="dashboard-grid">

        <BarChartSection
          title="Next Purchase Demand"
          description="Products customers are most likely to purchase next"
          data={analytics.productDemand}
          height={350}
          angleX={-35}
          barColor={PALETTE[0]}
        />

        <PieChartSection
          title="Favorite Categories"
          description="Most preferred fashion categories"
          data={analytics.categoryDemand}
        />

      </section>


      {/* ====================================================
          SECTION: SEASONAL PRODUCTS
      ==================================================== */}

      <div className="section-divider">
        <h2>🌦️ Seasonal Product Analysis</h2>
      </div>

      <section className="dashboard-grid">

        <BarChartSection
          title="Summer Product Preferences"
          description="Products preferred during summer season"
          data={analytics.summerProducts}
          angleX={-30}
          barColor="#fbbf24"
        />

        <BarChartSection
          title="Winter Product Preferences"
          description="Products preferred during winter season"
          data={analytics.winterProducts}
          angleX={-30}
          barColor="#60a5fa"
        />

      </section>

      <section className="chart-card full">
        <h2>Shopping Season</h2>

        <p className="chart-description">
          Seasonal purchasing preferences
        </p>

        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={analytics.season}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            <Bar
              dataKey="value"
              name="Customers"
              radius={[6, 6, 0, 0]}
              fill={PALETTE[2]}
            />
          </BarChart>
        </ResponsiveContainer>
      </section>


      {/* ====================================================
          SECTION: BRAND & SHOPPING
      ==================================================== */}

      <div className="section-divider">
        <h2>🏬 Brand &amp; Shopping Behavior</h2>
      </div>

      <section className="dashboard-grid">

        <BarChartSection
          title="Favorite Brands"
          description="Top brands preferred by customers"
          data={analytics.brandDemand}
          layout="vertical"
          sliceCount={10}
          barColor={PALETTE[4]}
        />

        <PieChartSection
          title="Shopping Mode"
          description="Online vs offline shopping preference"
          data={analytics.shoppingMode}
        />

      </section>

      <section className="dashboard-grid">

        <BarChartSection
          title="Shopping Frequency"
          description="How often customers shop"
          data={analytics.shoppingFrequency}
          angleX={-25}
          barColor={PALETTE[6]}
        />

        <BarChartSection
          title="Shopping Time"
          description="Preferred shopping time of day"
          data={analytics.shoppingTime}
          barColor={PALETTE[7]}
        />

      </section>

      <section className="dashboard-grid">

        <BarChartSection
          title="Brand Loyalty Reasons"
          description="Why customers stick to their favorite brands"
          data={analytics.brandReason}
          angleX={-25}
          barColor={PALETTE[5]}
        />

        <BarChartSection
          title="Revisit Reasons"
          description="Why customers return to a store"
          data={analytics.revisitReason}
          angleX={-25}
          barColor={PALETTE[3]}
        />

      </section>


      {/* ====================================================
          SECTION: CUSTOMER DEMOGRAPHICS
      ==================================================== */}

      <div className="section-divider">
        <h2>👤 Customer Demographics</h2>
      </div>

      <section className="dashboard-grid">

        <BarChartSection
          title="Age Group Distribution"
          data={analytics.ageGroup}
          barColor={PALETTE[0]}
          height={300}
        />

        <PieChartSection
          title="Gender Distribution"
          data={analytics.gender}
          height={300}
        />

      </section>

      <section className="dashboard-grid">

        <BarChartSection
          title="City Distribution"
          description="Top cities by customer count"
          data={analytics.city}
          sliceCount={10}
          angleX={-30}
          barColor={PALETTE[4]}
          height={300}
        />

        <BarChartSection
          title="Occupation"
          description="Customer occupations breakdown"
          data={analytics.occupation}
          angleX={-25}
          barColor={PALETTE[9]}
          height={300}
        />

      </section>

      <section className="dashboard-grid">

        <PieChartSection
          title="Locality"
          description="Urban vs Rural distribution"
          data={analytics.locality}
          height={300}
        />

        <BarChartSection
          title="Monthly Budget"
          description="Customer spending ranges"
          data={analytics.monthlyBudget}
          angleX={-30}
          barColor={PALETTE[3]}
          height={300}
        />

      </section>


      {/* ====================================================
          SECTION: STYLE PREFERENCES
      ==================================================== */}

      <div className="section-divider">
        <h2>👗 Style &amp; Fit Preferences</h2>
      </div>

      <section className="dashboard-grid three">

        <BarChartSection
          title="Size Preference"
          data={analytics.sizeDemand}
          height={280}
          barColor={PALETTE[0]}
        />

        <BarChartSection
          title="Color Preference"
          data={analytics.colorDemand}
          sliceCount={8}
          angleX={-30}
          height={280}
          barColor={PALETTE[1]}
        />

        <PieChartSection
          title="Preferred Fit"
          data={analytics.fitDemand}
          height={280}
        />

      </section>

      <section className="dashboard-grid">

        <BarChartSection
          title="Favorite Colors"
          description="Colors customers love the most"
          data={analytics.favoriteColors}
          sliceCount={10}
          angleX={-30}
          barColor={PALETTE[1]}
        />

        <BarChartSection
          title="Least Purchased Categories"
          description="Categories with lowest purchase intent"
          data={analytics.leastPurchased}
          angleX={-30}
          barColor={PALETTE[5]}
        />

      </section>


      {/* ====================================================
          SECTION: PURCHASE BEHAVIOR
      ==================================================== */}

      <div className="section-divider">
        <h2>💡 Purchase Behavior &amp; Trends</h2>
      </div>

      <section className="dashboard-grid">

        <BarChartSection
          title="Purchase Factors"
          description="What influences customer purchasing decisions"
          data={analytics.purchaseFactor}
          angleX={-30}
          barColor={PALETTE[0]}
        />

        <BarChartSection
          title="Discount Preference"
          description="Preferred discount percentages"
          data={analytics.discountPreference}
          barColor={PALETTE[3]}
        />

      </section>

      <section className="dashboard-grid">

        <PieChartSection
          title="Trend Follower"
          description="Do customers follow fashion trends?"
          data={analytics.trendFollower}
        />

        <BarChartSection
          title="Trend Source"
          description="Where customers discover new fashion trends"
          data={analytics.trendSource}
          angleX={-25}
          barColor={PALETTE[9]}
        />

      </section>

      <section className="dashboard-grid">

        <BarChartSection
          title="Trend Purchase Speed"
          description="How fast customers buy trending items"
          data={analytics.trendPurchaseSpeed}
          angleX={-25}
          barColor={PALETTE[7]}
        />

        <BarChartSection
          title="Out-of-Stock Behaviour"
          description="What customers do when product is unavailable"
          data={analytics.stockBehavior}
          angleX={-25}
          barColor={PALETTE[5]}
        />

      </section>


      {/* ====================================================
          SECTION: CROSS ANALYSIS (Section 23 in Python)
      ==================================================== */}

      <div className="section-divider">
        <h2>🔀 Cross Analysis</h2>
      </div>

      <HeatmapTable
        title="City vs Next Purchase"
        description="Product demand distribution across cities"
        crosstab={analytics.cityProduct}
      />

      <HeatmapTable
        title="Age Group vs Next Purchase"
        description="Product preferences by age group"
        crosstab={analytics.ageProduct}
      />

      <HeatmapTable
        title="Season vs Next Purchase"
        description="Seasonal patterns in product demand"
        crosstab={analytics.seasonProduct}
      />

      <HeatmapTable
        title="Gender vs Next Purchase"
        description="Product preferences by gender"
        crosstab={analytics.genderProduct}
      />


      {/* ====================================================
          SECTION: STOCK RECOMMENDATIONS (Section 43 in Python)
      ==================================================== */}

      <div className="section-divider">
        <h2>📦 Stock Recommendations</h2>
      </div>

      <section className="recommendation-section">

        <div className="section-title">
          <div>
            <h2>Inventory Decision Matrix</h2>

            <p>
              Suggested stock decisions based on customer demand percentage
              (thresholds: ≥15% High, ≥10% Medium, &lt;10% Low)
            </p>
          </div>
        </div>

        <div className="recommendation-table">

          <div className="table-header">
            <span>Product</span>
            <span>Customers</span>
            <span>Demand</span>
            <span>Recommendation</span>
          </div>

          {analytics.stockRecommendations.map(
            (item, index) => {

              const high =
                parseFloat(item.percentage) >= 15;

              const medium =
                parseFloat(item.percentage) >= 10 &&
                parseFloat(item.percentage) < 15;

              return (

                <div
                  className="table-row"
                  key={index}
                >

                  <span className="product-name">
                    {item.product}
                  </span>

                  <span>
                    {item.customers}
                  </span>

                  <span>
                    {item.percentage}%
                  </span>

                  <span>
                    <span
                      className={
                        high
                          ? "status high"
                          : medium
                          ? "status medium"
                          : "status low"
                      }
                    >
                      {item.recommendation}
                    </span>
                  </span>

                </div>

              );

            }
          )}

        </div>

      </section>


      {/* ====================================================
          SECTION: KEY INSIGHTS (Section 46 - Summary in Python)
      ==================================================== */}

      <div className="section-divider">
        <h2>🎯 Key Insights</h2>
      </div>

      <div className="insights-grid">

        <div className="insight-card">
          <h3>🛍️ Most Demanded Product</h3>
          <p>
            <span className="highlight">{mostDemandedProduct}</span> leads
            product demand with{" "}
            <span className="highlight">
              {analytics.productDemand[0]?.value || 0}
            </span>{" "}
            customers interested.
          </p>
        </div>

        <div className="insight-card">
          <h3>👕 Top Fashion Category</h3>
          <p>
            <span className="highlight">{mostPopularCategory}</span> is
            the most popular fashion category among surveyed customers.
          </p>
        </div>

        <div className="insight-card">
          <h3>🏷️ Leading Brand</h3>
          <p>
            <span className="highlight">{mostPopularBrand}</span> is
            the most favored brand, chosen by{" "}
            <span className="highlight">
              {analytics.brandDemand[0]?.value || 0}
            </span>{" "}
            respondents.
          </p>
        </div>

        <div className="insight-card">
          <h3>📏 Size &amp; Fit</h3>
          <p>
            Most preferred size is{" "}
            <span className="highlight">{mostPreferredSize}</span> and
            the top fit preference is{" "}
            <span className="highlight">{topFit}</span>.
          </p>
        </div>

        <div className="insight-card">
          <h3>🛒 Shopping Channel</h3>
          <p>
            <span className="highlight">{mostPopularMode}</span> shopping
            dominates, and customers primarily discover trends
            through{" "}
            <span className="highlight">{topTrendSource}</span>.
          </p>
        </div>

        <div className="insight-card">
          <h3>🎨 Color Trend</h3>
          <p>
            <span className="highlight">{topColor}</span> is the most
            popular color for next purchases among all respondents.
          </p>
        </div>

      </div>


      {/* ====================================================
          FOOTER
      ==================================================== */}

      <footer className="analytics-footer">

        <p>
          Fashion Survey — Business Analytics Dashboard
        </p>

        <span>
          Data is updated automatically from Firebase • All analyses mirror fasionsurvey.py
        </span>

      </footer>

    </div>
  );
}