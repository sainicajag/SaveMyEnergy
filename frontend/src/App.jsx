import { useState, useEffect, useRef } from "react";
import GuestLogin from "./components/GuestLogin";
import logo from "./assets/logo.png";

const DashboardView = ({ result, styles }) => {
  if (!result) {
    return (
      <div style={styles.dashboardWrapper}>
        <h2 style={styles.pageTitle}>Forecasting &amp; Decision Engine</h2>
        <p style={styles.emptyState}>
          No live decision snapshot yet. The platform is waiting for market
          inputs.
        </p>
      </div>
    );
  }

  const forecastDemand = result?.market_pressure?.forecast_demand_mw ?? 0;
  const observedPrice = Number(result?.actual_price ?? 0);
  const predictedPrice = Number(result?.predicted_price ?? 0);
  const pressureLevel = result?.predicted_pressure_level ?? "medium";
  const targetAppliance = result?.target_appliance
    ? result.target_appliance.replaceAll("_", " ")
    : "No flexible appliance selected";
  const estimatedSavings = Number(result?.estimated_savings ?? 0);
  const tariff = Number(result?.household?.unit_rate_gbp_per_kwh ?? 0);

  const fallbackSeries = [
    { label: "P1", actual_price: 20.8, predicted_price: 21.4 },
    { label: "P2", actual_price: 21.5, predicted_price: 22.1 },
    { label: "P3", actual_price: 22.2, predicted_price: 22.8 },
    { label: "P4", actual_price: 21.9, predicted_price: 22.6 },
    { label: "P5", actual_price: 23.0, predicted_price: 23.7 },
    {
      label: "P6",
      actual_price: observedPrice || 22.4,
      predicted_price: predictedPrice || 23.2,
    },
  ];

  const chartSeries =
    result?.dashboard_series && result.dashboard_series.length > 0
      ? result.dashboard_series
      : fallbackSeries;

  // 🔧 ONLY CHANGE IS HERE (scaling fix)

  const minPrice = Math.min(
    ...chartSeries.flatMap((p) => [
      Number(p.actual_price ?? 0),
      Number(p.predicted_price ?? 0),
    ])
  );

  const maxPrice = Math.max(
    ...chartSeries.flatMap((p) => [
      Number(p.actual_price ?? 0),
      Number(p.predicted_price ?? 0),
    ])
  );

  const range = maxPrice - minPrice || 1;

  const actualPoints = chartSeries
    .map((point, index) => {
      const x = (index / Math.max(chartSeries.length - 1, 1)) * 100;
      const y =
        100 - ((Number(point.actual_price ?? 0) - minPrice) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  const predictedPoints = chartSeries
    .map((point, index) => {
      const x = (index / Math.max(chartSeries.length - 1, 1)) * 100;
      const y =
        100 - ((Number(point.predicted_price ?? 0) - minPrice) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  const pressureColor =
    pressureLevel === "high"
      ? "#dc2626"
      : pressureLevel === "low"
      ? "#16a34a"
      : "#f59e0b";

  return (
    <div style={styles.dashboardWrapper}>
      <div style={styles.heroCard}>
        <div style={styles.heroHeaderRow}>
          <div>
            <h2 style={styles.pageTitle}>Forecasting &amp; Decision Engine</h2>
            <p style={styles.pageSubtitle}>
              Turning live electricity market signals into simple household
              energy actions
            </p>
          </div>
          <div style={styles.liveBadge}>Live + modelled decision flow</div>
        </div>

        <p style={styles.leadText}>
          This prototype combines live electricity system signals with a
          household decision engine. NESO demand data and Elexon/BMRS market
          price data are used to monitor current market conditions. A
          lightweight forecasting model then estimates short-term price
          movement, which is converted into a pressure signal and translated
          into practical household advice.
        </p>
      </div>

      <div style={styles.sectionCard}>
        <h3 style={styles.sectionTitle}>1. Live market inputs</h3>
        <div style={styles.cardGrid4}>
          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Forecast demand</div>
            <div style={styles.metricValue}>
              {forecastDemand.toLocaleString()} MW
            </div>
            <div style={styles.metricSubtext}>Source: NESO demand dataset</div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Observed market price</div>
            <div style={styles.metricValue}>
              {observedPrice.toFixed(2)} p/kWh
            </div>
            <div style={styles.metricSubtext}>
              Source: Elexon / BMRS market price feed
            </div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Household tariff</div>
            <div style={styles.metricValue}>£{tariff.toFixed(2)}/kWh</div>
            <div style={styles.metricSubtext}>
              Mock household tariff profile
            </div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Flexible appliance target</div>
            <div style={styles.metricValueSmall}>{targetAppliance}</div>
            <div style={styles.metricSubtext}>
              Chosen from household appliance profile
            </div>
          </div>
        </div>
      </div>

      <div style={styles.sectionCard}>
        <h3 style={styles.sectionTitle}>2. How the engine works</h3>
        <div style={styles.flowRow}>
          {[
            "NESO demand input",
            "Elexon/BMRS observed price",
            "Recent price history",
            "Linear regression forecast",
            "Pressure classification",
            "Household action + saving estimate",
          ].map((step, idx) => (
            <div key={step} style={styles.flowStepWrap}>
              <div style={styles.flowStep}>{step}</div>
              {idx < 5 && <div style={styles.flowArrow}>→</div>}
            </div>
          ))}
        </div>

        <p style={styles.explainerText}>
          The system stores recent observed prices, trains a lightweight
          forecasting model on rolling 3-price windows, predicts the next
          short-term price, compares that forecast with the current observed
          price, and then converts the result into a simple action for the
          household.
        </p>
      </div>

      <div style={styles.sectionCard}>
        <h3 style={styles.sectionTitle}>3. Current decision snapshot</h3>
        <div style={styles.cardGrid5}>
          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Observed price</div>
            <div style={styles.metricValue}>
              {observedPrice.toFixed(2)} p/kWh
            </div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Predicted next price</div>
            <div style={styles.metricValue}>
              {predictedPrice.toFixed(2)} p/kWh
            </div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Predicted pressure</div>
            <div style={{ ...styles.metricValue, color: pressureColor }}>
              {pressureLevel.toUpperCase()}
            </div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Recommended action</div>
            <div style={styles.metricValueSmall}>
              {pressureLevel === "high"
                ? "Delay flexible usage"
                : pressureLevel === "low"
                ? "Use flexible appliances now"
                : "Reduce non-essential usage"}
            </div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Estimated saving</div>
            <div style={styles.metricValue}>£{estimatedSavings.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div style={styles.sectionCard}>
        <h3 style={styles.sectionTitle}>
          4. Observed vs predicted energy price
        </h3>
        <div style={styles.chartCard}>
          <svg viewBox="0 0 100 100" style={styles.lineChart}>
            <polyline
              fill="none"
              stroke="#1d4ed8"
              strokeWidth="2.2"
              points={actualPoints}
            />
            <polyline
              fill="none"
              stroke="#312e81"
              strokeWidth="2.2"
              strokeDasharray="4 3"
              points={predictedPoints}
            />
          </svg>

          <div style={styles.legendRow}>
            <div style={styles.legendItem}>
              <span style={{ ...styles.legendDot, background: "#1d4ed8" }} />
              Observed price
            </div>
            <div style={styles.legendItem}>
              <span style={{ ...styles.legendDot, background: "#312e81" }} />
              Predicted price
            </div>
          </div>

          <p style={styles.explainerText}>
            The observed line shows recent market prices received by the
            backend. The forecast line shows the model’s next-step estimate
            based on recent price history. The gap between current and predicted
            price is what drives the pressure signal.
          </p>
        </div>
      </div>

      <div style={styles.twoColumnGrid}>
        <div style={styles.sectionCard}>
          <h3 style={styles.sectionTitle}>5. Pressure classification logic</h3>
          <div style={styles.logicBox}>
            <div style={styles.logicRow}>
              <span style={styles.logicLabel}>
                If predicted price is &gt; current price by more than 3%
              </span>
              <span
                style={{
                  ...styles.logicBadge,
                  background: "#fee2e2",
                  color: "#991b1b",
                }}
              >
                HIGH
              </span>
            </div>
            <div style={styles.logicRow}>
              <span style={styles.logicLabel}>
                If predicted price is &lt; current price by more than 3%
              </span>
              <span
                style={{
                  ...styles.logicBadge,
                  background: "#dcfce7",
                  color: "#166534",
                }}
              >
                LOW
              </span>
            </div>
            <div style={styles.logicRow}>
              <span style={styles.logicLabel}>Otherwise</span>
              <span
                style={{
                  ...styles.logicBadge,
                  background: "#fef3c7",
                  color: "#92400e",
                }}
              >
                MEDIUM
              </span>
            </div>
          </div>

          <p style={styles.explainerText}>
            This step translates a technical forecast into a traffic-light style
            signal that is easier for households to understand and act on.
          </p>
        </div>

        <div style={styles.sectionCard}>
          <h3 style={styles.sectionTitle}>6. How savings are estimated</h3>
          <div style={styles.flowColumn}>
            <div style={styles.flowStep}>Pressure level</div>
            <div style={styles.flowArrowDown}>↓</div>
            <div style={styles.flowStep}>Flexible appliance identified</div>
            <div style={styles.flowArrowDown}>↓</div>
            <div style={styles.flowStep}>
              Tariff + appliance kWh profile applied
            </div>
            <div style={styles.flowArrowDown}>↓</div>
            <div style={styles.flowStep}>
              Estimated household saving produced
            </div>
          </div>

          <p style={styles.explainerText}>
            Savings are estimated using the household tariff, appliance
            characteristics, and the recommended action type: use now, delay, or
            reduce.
          </p>
        </div>
      </div>

      <div style={styles.sectionCard}>
        <h3 style={styles.sectionTitle}>7. Live vs modelled components</h3>
        <div style={styles.twoColumnGrid}>
          <div style={styles.infoPanel}>
            <h4 style={styles.infoPanelTitle}>Live data layer</h4>
            <ul style={styles.infoList}>
              <li>NESO forecast demand input</li>
              <li>Elexon / BMRS observed market price</li>
              <li>Recent price history collected by backend</li>
            </ul>
          </div>

          <div style={styles.infoPanel}>
            <h4 style={styles.infoPanelTitle}>Modelled household layer</h4>
            <ul style={styles.infoList}>
              <li>Mock household tariff profile</li>
              <li>Flexible appliance list</li>
              <li>Appliance energy-use assumptions</li>
              <li>Estimated saving calculation logic</li>
            </ul>
          </div>
        </div>

        <p style={styles.explainerText}>
          This makes the prototype transparent: live market signals drive the
          forecast, while household-specific impact is estimated using a defined
          household model.
        </p>
      </div>
    </div>
  );
};

function App() {
  const [latestAdvice, setLatestAdvice] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [appliances, setAppliances] = useState([]);
  const [user, setUser] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("advisor");
  const [liveMode, setLiveMode] = useState(false);
  const [accessibilityMode, setAccessibilityMode] = useState(false);

  const [liveSavingsHistory, setLiveSavingsHistory] = useState([]);

  const livePointCounter = useRef(1);
  const demoScenarioIndex = useRef(0);

  const mockSavingsHistory = [
    { week: "W1", saving: 4.2 },
    { week: "W2", saving: 5.1 },
    { week: "W3", saving: 3.8 },
    { week: "W4", saving: 6.2 },
    { week: "W5", saving: 4.9 },
    { week: "W6", saving: 5.7 },
    { week: "W7", saving: 6.5 },
    { week: "W8", saving: 5.9 },
  ];

  const demoScenarios = {
    low: [
      {
        market_pressure: { pressure_level: "low", forecast_demand_mw: 24000 },
        estimated_savings: 0.15,
        actual_price: 20.8,
        predicted_price: 19.9,
        predicted_pressure_level: "low",
        target_appliance: "washing_machine",
        household: {
          unit_rate_gbp_per_kwh: 0.24,
        },
        ai_advice:
          "Good time to use flexible appliances now. Energy demand is low and costs are cheaper right now.",
        dashboard_series: [
          { label: "P1", actual_price: 22.0, predicted_price: 21.4 },
          { label: "P2", actual_price: 21.8, predicted_price: 21.1 },
          { label: "P3", actual_price: 21.3, predicted_price: 20.8 },
          { label: "P4", actual_price: 21.0, predicted_price: 20.5 },
          { label: "P5", actual_price: 20.9, predicted_price: 20.1 },
          { label: "P6", actual_price: 20.8, predicted_price: 19.9 },
        ],
      },
      {
        market_pressure: {
          pressure_level: "medium",
          forecast_demand_mw: 31000,
        },
        estimated_savings: 0.11,
        actual_price: 22.5,
        predicted_price: 22.8,
        predicted_pressure_level: "medium",
        target_appliance: "dishwasher",
        household: {
          unit_rate_gbp_per_kwh: 0.24,
        },
        ai_advice:
          "Energy demand is moderate. Use only what you need now and delay anything flexible until later if possible.",
        dashboard_series: [
          { label: "P1", actual_price: 21.7, predicted_price: 21.9 },
          { label: "P2", actual_price: 22.0, predicted_price: 22.1 },
          { label: "P3", actual_price: 22.2, predicted_price: 22.3 },
          { label: "P4", actual_price: 22.4, predicted_price: 22.5 },
          { label: "P5", actual_price: 22.5, predicted_price: 22.7 },
          { label: "P6", actual_price: 22.5, predicted_price: 22.8 },
        ],
      },
      {
        market_pressure: { pressure_level: "high", forecast_demand_mw: 41000 },
        estimated_savings: 0.08,
        actual_price: 25.4,
        predicted_price: 26.6,
        predicted_pressure_level: "high",
        target_appliance: "electric_heater",
        household: {
          unit_rate_gbp_per_kwh: 0.24,
        },
        ai_advice:
          "Delay non-essential appliance use for now. Waiting for a cheaper window could help reduce today’s energy cost.",
        dashboard_series: [
          { label: "P1", actual_price: 23.2, predicted_price: 23.8 },
          { label: "P2", actual_price: 23.8, predicted_price: 24.5 },
          { label: "P3", actual_price: 24.1, predicted_price: 24.9 },
          { label: "P4", actual_price: 24.7, predicted_price: 25.5 },
          { label: "P5", actual_price: 25.0, predicted_price: 26.0 },
          { label: "P6", actual_price: 25.4, predicted_price: 26.6 },
        ],
      },
    ],
    high: [
      {
        market_pressure: { pressure_level: "low", forecast_demand_mw: 25000 },
        estimated_savings: 0.25,
        actual_price: 20.4,
        predicted_price: 19.5,
        predicted_pressure_level: "low",
        target_appliance: "tumble_dryer",
        household: {
          unit_rate_gbp_per_kwh: 0.27,
        },
        ai_advice:
          "Good time to run higher-usage appliances now. This is a cheaper energy window and could reduce your bill.",
        dashboard_series: [
          { label: "P1", actual_price: 21.7, predicted_price: 21.0 },
          { label: "P2", actual_price: 21.3, predicted_price: 20.6 },
          { label: "P3", actual_price: 21.0, predicted_price: 20.2 },
          { label: "P4", actual_price: 20.8, predicted_price: 20.0 },
          { label: "P5", actual_price: 20.6, predicted_price: 19.7 },
          { label: "P6", actual_price: 20.4, predicted_price: 19.5 },
        ],
      },
      {
        market_pressure: {
          pressure_level: "medium",
          forecast_demand_mw: 33500,
        },
        estimated_savings: 0.18,
        actual_price: 23.4,
        predicted_price: 23.8,
        predicted_pressure_level: "medium",
        target_appliance: "dishwasher",
        household: {
          unit_rate_gbp_per_kwh: 0.27,
        },
        ai_advice:
          "Energy prices look moderate. Use important appliances carefully and delay anything flexible if you can.",
        dashboard_series: [
          { label: "P1", actual_price: 22.5, predicted_price: 22.8 },
          { label: "P2", actual_price: 22.8, predicted_price: 23.0 },
          { label: "P3", actual_price: 23.0, predicted_price: 23.3 },
          { label: "P4", actual_price: 23.1, predicted_price: 23.5 },
          { label: "P5", actual_price: 23.3, predicted_price: 23.7 },
          { label: "P6", actual_price: 23.4, predicted_price: 23.8 },
        ],
      },
      {
        market_pressure: { pressure_level: "high", forecast_demand_mw: 43000 },
        estimated_savings: 0.13,
        actual_price: 27.1,
        predicted_price: 28.4,
        predicted_pressure_level: "high",
        target_appliance: "washing_machine",
        household: {
          unit_rate_gbp_per_kwh: 0.27,
        },
        ai_advice:
          "Avoid using high-energy appliances right now. Waiting until prices ease could help you save more.",
        dashboard_series: [
          { label: "P1", actual_price: 24.9, predicted_price: 25.6 },
          { label: "P2", actual_price: 25.5, predicted_price: 26.2 },
          { label: "P3", actual_price: 26.0, predicted_price: 26.8 },
          { label: "P4", actual_price: 26.4, predicted_price: 27.4 },
          { label: "P5", actual_price: 26.7, predicted_price: 27.9 },
          { label: "P6", actual_price: 27.1, predicted_price: 28.4 },
        ],
      },
    ],
  };

  const nowLabel = () =>
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const speakText = (text) => {
    if (!("speechSynthesis" in window) || !text) return;

    const utterance = new SpeechSynthesisUtterance(String(text));
    utterance.lang = "en-GB";
    utterance.rate = 1;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const ukVoice = voices.find((v) => v.lang === "en-GB");
    if (ukVoice) utterance.voice = ukVoice;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const applyAdviceResult = (data) => {
    setResult(data);
    setLatestAdvice(data);
    setLastUpdated(nowLabel());
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("guest_id");
    if (savedUser) {
      setUser(savedUser);
      const savedAppliances = JSON.parse(localStorage.getItem(savedUser)) || [];
      setAppliances(savedAppliances);
    }
  }, []);

  useEffect(() => {
    if (!liveMode || !user) return;

    let isCancelled = false;

    const fetchLiveSnapshot = async () => {
      try {
        const applianceParam = encodeURIComponent(appliances.join(","));
        const res = await fetch(
          `http://127.0.0.1:8000/household-advice?appliances=${applianceParam}`
        );

        if (!res.ok) throw new Error("Backend failed");

        const data = await res.json();

        if (!isCancelled) {
          setError("");
          applyAdviceResult(data);
          setLiveSavingsHistory((prev) => [
            ...prev.slice(-7),
            {
              week: `T${livePointCounter.current}`,
              saving: Number(data?.estimated_savings ?? 0),
            },
          ]);
          livePointCounter.current += 1;
        }
      } catch (err) {
        if (!isCancelled) {
          console.error(err);
          setError("Could not load live data.");
        }
      }
    };

    fetchLiveSnapshot();
    const interval = setInterval(fetchLiveSnapshot, 6000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [liveMode, user, appliances]);

  useEffect(() => {
    setError("");
    setResult(null);

    if (!liveMode) {
      setLatestAdvice(null);
      setLastUpdated(null);
    }
  }, [liveMode]);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setAppliances([]);
    setResult(null);
    setError("");
    setLatestAdvice(null);
    setLastUpdated(null);
    setLiveSavingsHistory([]);
    livePointCounter.current = 1;
    demoScenarioIndex.current = 0;
    window.speechSynthesis?.cancel();
  };

  const getAdvice = async () => {
    if (!liveMode) {
      const scenarios = demoScenarios["high"]; // or just keep high as default demo
      const scenario = scenarios[demoScenarioIndex.current % scenarios.length];
      demoScenarioIndex.current += 1;
      applyAdviceResult(scenario);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const applianceParam = encodeURIComponent(appliances.join(","));
      const res = await fetch(
        `http://127.0.0.1:8000/household-advice?appliances=${applianceParam}`
      );

      if (!res.ok) throw new Error("Backend failed");

      const data = await res.json();
      applyAdviceResult(data);
    } catch {
      setError("Could not load advice.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <GuestLogin
        onLogin={() => {
          const savedUser = localStorage.getItem("guest_id");
          setUser(savedUser);
        }}
      />
    );
  }

  const insightsData = liveMode ? liveSavingsHistory : mockSavingsHistory;
  const hasInsightsData = insightsData.length > 0;

  const totalWeeklySavings = hasInsightsData
    ? Number(insightsData[insightsData.length - 1].saving).toFixed(2)
    : "--";

  const monthlyProjection = hasInsightsData
    ? (
        insightsData.reduce((sum, d) => sum + Number(d.saving), 0) *
        (4 / Math.max(insightsData.length, 1))
      ).toFixed(2)
    : "--";

  const bestWeek = hasInsightsData
    ? Math.max(...insightsData.map((d) => Number(d.saving))).toFixed(2)
    : "--";

  const avgWeekly = hasInsightsData
    ? (
        insightsData.reduce((sum, d) => sum + Number(d.saving), 0) /
        insightsData.length
      ).toFixed(2)
    : "--";

  const maxSaving = hasInsightsData
    ? Math.max(...insightsData.map((d) => Number(d.saving)), 1)
    : 1;

  const chartSummary = hasInsightsData
    ? `Savings were highest at £${bestWeek} and average savings were £${avgWeekly}.`
    : "No savings data available yet.";

  return (
    <div
      style={{
        ...styles.page,
      }}
    >
      <div
        style={{
          ...styles.container,
        }}
      >
        <div
          style={{
            ...styles.sidebar,
            ...(accessibilityMode ? styles.sidebarAccessible : {}),
          }}
        >
          <div style={{ display: "flex", justifyContent: "center" }}>
            <img
              src={logo}
              alt="SaveMyEnergy logo"
              style={{ width: 60, height: 60, borderRadius: "50%" }}
            />
          </div>

          <button
            onClick={() => setTab("advisor")}
            style={{
              ...styles.tabButton,
              ...(tab === "advisor"
                ? styles.activeTabButton
                : styles.inactiveTabButton),
              ...(accessibilityMode ? styles.tabButtonAccessible : {}),
            }}
            aria-label="Open Advisor tab"
          >
            <span style={styles.tabTitle}>Advisor</span>
            <span style={styles.tabSubtitle}>Simple household guidance</span>
          </button>

          <button
            onClick={() => setTab("insights")}
            style={{
              ...styles.tabButton,
              ...(tab === "insights"
                ? styles.activeTabButton
                : styles.inactiveTabButton),
              ...(accessibilityMode ? styles.tabButtonAccessible : {}),
            }}
            aria-label="Open Insights tab"
          >
            <span style={styles.tabTitle}>Insights</span>
            <span style={styles.tabSubtitle}>Savings history and trends</span>
          </button>

          <button
            onClick={() => setTab("dashboard")}
            style={{
              ...styles.tabButton,
              ...(tab === "dashboard"
                ? styles.activeTabButton
                : styles.inactiveTabButton),
              ...(accessibilityMode ? styles.tabButtonAccessible : {}),
            }}
            aria-label="Open Dashboard tab"
          >
            <span style={styles.tabTitle}>Dashboard</span>
            <span style={styles.tabSubtitle}>System Insights</span>
          </button>
        </div>

        <div
          style={{
            ...styles.card,
          }}
        >
          <button
            style={{
              ...styles.logoutButton,
              ...(accessibilityMode ? styles.largeActionButton : {}),
            }}
            onClick={handleLogout}
            aria-label="Log out"
          >
            Logout
          </button>

          <div
            style={{
              ...styles.topControls,
            }}
          >
            <div style={styles.modeRow}>
              <div style={styles.modeTextBlock}>
                <p style={styles.modeEyebrow}>System Mode</p>
                <h3 style={styles.modeTitle}>
                  {liveMode ? "Live Mode" : "Demo Mode"}
                </h3>
                <p style={styles.modeSubtitle}>
                  {liveMode
                    ? "Pages are using live backend-fed data"
                    : "Pages are using controlled demo data"}
                </p>
              </div>

              <div style={styles.topBar}>
                {/* LEFT: Accessibility (BIG) */}
                <button
                  onClick={() => setAccessibilityMode(!accessibilityMode)}
                  style={{
                    ...styles.accessibilityButton,
                    ...(accessibilityMode ? styles.accessibilityOn : {}),
                    minWidth: "140px",
                    height: "40px",
                    flexShrink: 0,
                  }}
                  onMouseDown={(e) =>
                    (e.currentTarget.style.transform = "scale(0.97)")
                  }
                  onMouseUp={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                >
                  Accessibility: {accessibilityMode ? "On" : "Off"}
                </button>

                {/* RIGHT: Demo / Live (SMALL) */}
                <div style={styles.modeToggle}>
                  <span
                    onClick={() => setLiveMode(false)}
                    style={!liveMode ? styles.activeMode : styles.inactiveMode}
                  >
                    Demo
                  </span>
                  <span
                    onClick={() => setLiveMode(true)}
                    style={liveMode ? styles.activeMode : styles.inactiveMode}
                  >
                    Live
                  </span>
                </div>
              </div>
            </div>
          </div>

          {tab === "advisor" ? (
            <>
              <h1
                style={{
                  ...styles.title,
                  ...(accessibilityMode ? styles.titleAccessible : {}),
                }}
              >
                SaveMyEnergy
              </h1>
              <p
                style={{
                  ...styles.subtitle,
                  ...(accessibilityMode ? styles.subtitleAccessible : {}),
                }}
              >
                Clear, simple advice to help households save money at the right
                time
              </p>

              <div style={styles.usageCard}>
                <p style={styles.usageLabel}>Household Usage</p>

                <div
                  style={{
                    ...styles.usageBadge,
                    backgroundColor:
                      result?.usage_level === "high"
                        ? "#fee2e2"
                        : result?.usage_level === "low"
                        ? "#dcfce7"
                        : "#fef3c7",
                    color:
                      result?.usage_level === "high"
                        ? "#991b1b"
                        : result?.usage_level === "low"
                        ? "#166534"
                        : "#92400e",
                  }}
                >
                  {result?.usage_level === "high"
                    ? "HIGH USAGE"
                    : result?.usage_level === "low"
                    ? "LOW USAGE"
                    : "MEDIUM USAGE"}
                </div>
              </div>

              <button
                style={{
                  ...styles.mainButton,
                  ...(accessibilityMode ? styles.largeActionButton : {}),
                }}
                onClick={getAdvice}
                aria-label={
                  loading
                    ? "Calculating advice"
                    : liveMode
                    ? "Refresh live advice"
                    : "Show demo advice"
                }
              >
                {loading
                  ? "Calculating..."
                  : liveMode
                  ? "Refresh Live Advice"
                  : "Show Demo Advice"}
              </button>

              {error && (
                <p
                  style={{
                    ...styles.error,
                    ...(accessibilityMode ? styles.errorAccessible : {}),
                  }}
                >
                  {error}
                </p>
              )}

              {!result && (
                <p
                  style={{
                    ...styles.emptyState,
                    ...(accessibilityMode ? styles.emptyStateAccessible : {}),
                  }}
                >
                  No advice yet. System is monitoring.
                </p>
              )}

              {result && (
                <div
                  style={{
                    ...styles.resultCard,
                    ...(accessibilityMode ? styles.resultCardAccessible : {}),
                  }}
                >
                  <div style={styles.cardHeaderRow}>
                    <h3 style={styles.sectionTitle}>Latest Advice</h3>
                    <span
                      style={liveMode ? styles.redBadge : styles.yellowBadge}
                    >
                      {liveMode ? "Live backend-fed" : "Demo scenario"}
                    </span>
                  </div>

                  <p style={styles.pressure}>
                    Market:{" "}
                    {result.market_pressure?.pressure_level?.toUpperCase()}
                  </p>

                  <h2
                    style={{
                      ...styles.advice,
                      ...(accessibilityMode ? styles.adviceAccessible : {}),
                    }}
                  >
                    {result.ai_advice}
                  </h2>

                  <p
                    style={{
                      ...styles.savings,
                      ...(accessibilityMode ? styles.savingsAccessible : {}),
                    }}
                  >
                    Save about £{Number(result.estimated_savings).toFixed(2)}
                  </p>

                  <div
                    style={{
                      ...styles.readAloudRow,
                      ...(accessibilityMode
                        ? styles.readAloudRowAccessible
                        : {}),
                      marginTop: "14px",
                    }}
                  >
                    <button
                      onClick={() => speakText(result.ai_advice)}
                      style={{
                        ...styles.readAloudButton,
                        ...(accessibilityMode ? styles.largeActionButton : {}),
                      }}
                      aria-label="Read result aloud"
                    >
                      🔊 Read aloud
                    </button>

                    <small style={styles.lastUpdatedText}>
                      Last updated: {lastUpdated}
                    </small>
                  </div>
                </div>
              )}
            </>
          ) : tab === "insights" ? (
            <>
              <h1
                style={{
                  ...styles.title,
                  ...(accessibilityMode ? styles.titleAccessible : {}),
                }}
              >
                Savings Insights
              </h1>
              <p
                style={{
                  ...styles.subtitle,
                  ...(accessibilityMode ? styles.subtitleAccessible : {}),
                }}
              >
                {liveMode
                  ? "Live savings snapshots captured from the backend feed over time."
                  : "Estimated savings based on similar households, to help users understand their progress."}
              </p>

              <div style={styles.metricsGrid}>
                <div style={styles.metricCard}>
                  <p style={styles.metricLabel}>
                    {liveMode ? "Latest Snapshot" : "Latest Week"}
                  </p>
                  <h2 style={styles.metricValue}>
                    {totalWeeklySavings === "--"
                      ? "--"
                      : `£${totalWeeklySavings}`}
                  </h2>
                </div>

                <div style={styles.metricCard}>
                  <p style={styles.metricLabel}>
                    {liveMode
                      ? "Projected Monthly Saving"
                      : "2-Month Projection"}
                  </p>
                  <h2 style={styles.metricValue}>
                    {monthlyProjection === "--"
                      ? "--"
                      : `£${monthlyProjection}`}
                  </h2>
                </div>

                <div style={styles.metricCard}>
                  <p style={styles.metricLabel}>
                    {liveMode ? "Best Snapshot" : "Best Week"}
                  </p>
                  <h2 style={styles.metricValue}>
                    {bestWeek === "--" ? "--" : `£${bestWeek}`}
                  </h2>
                </div>

                <div style={styles.metricCard}>
                  <p style={styles.metricLabel}>Average Saving</p>
                  <h2 style={styles.metricValue}>
                    {avgWeekly === "--" ? "--" : `£${avgWeekly}`}
                  </h2>
                </div>
              </div>

              <div style={styles.largeCard}>
                <div style={styles.cardHeaderRow}>
                  <h3 style={styles.sectionTitle}>
                    {liveMode
                      ? "Live Savings History"
                      : "Estimated Savings History"}
                  </h3>
                  <span style={liveMode ? styles.redBadge : styles.yellowBadge}>
                    {liveMode
                      ? "Live backend-fed"
                      : "Estimated from similar households"}
                  </span>
                </div>

                {!hasInsightsData ? (
                  <p style={styles.emptyState}>
                    No live savings points yet. Switch to Live Mode and wait for
                    snapshots or press refresh on the Advisor page.
                  </p>
                ) : (
                  <>
                    <div
                      style={styles.chart}
                      aria-label="Savings history chart"
                    >
                      {insightsData.map((item, i) => (
                        <div key={i} style={styles.barWrapper}>
                          <div
                            style={{
                              ...styles.bar,
                              backgroundColor: liveMode ? "#15803d" : "#b45309",
                              height: `${
                                (Number(item.saving) / maxSaving) * 180
                              }px`,
                              width: accessibilityMode ? "42px" : "34px",
                            }}
                            aria-hidden="true"
                          />
                          <span style={styles.barValue}>
                            £{Number(item.saving).toFixed(2)}
                          </span>
                          <span style={styles.barLabel}>{item.week}</span>
                        </div>
                      ))}
                    </div>
                    <p
                      style={{
                        ...styles.chartSummary,
                        ...(accessibilityMode
                          ? styles.chartSummaryAccessible
                          : {}),
                      }}
                    >
                      Text summary: {chartSummary}
                    </p>
                  </>
                )}
              </div>
            </>
          ) : (
            <DashboardView result={result} styles={styles} />
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "24px",
    fontFamily: "Arial, sans-serif",
  },
  pageAccessible: {
    padding: "28px",
  },
  container: {
    display: "flex",
    width: "100%",
    maxWidth: "1180px",
    gap: "22px",
  },
  containerAccessible: {
    gap: "26px",
  },
  sidebar: {
    width: "250px",
    backgroundColor: "#020617",
    borderRadius: "20px",
    padding: "22px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  },
  sidebarAccessible: {
    width: "290px",
    padding: "24px",
    gap: "18px",
  },
  sidebarHeader: {
    color: "white",
    fontSize: "22px",
    fontWeight: "800",
    marginBottom: "8px",
  },
  tabButton: {
    padding: "18px 16px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.08)",
    cursor: "pointer",
    textAlign: "left",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    transition: "0.2s ease",
  },
  tabButtonAccessible: {
    padding: "22px 18px",
    minHeight: "88px",
  },
  activeTabButton: {
    backgroundColor: "#4338ca",
    color: "white",
  },
  inactiveTabButton: {
    backgroundColor: "#111827",
    color: "#f9fafb",
  },
  tabTitle: {
    fontWeight: "800",
    fontSize: "16px",
  },
  tabSubtitle: {
    fontSize: "12px",
    opacity: 0.95,
    lineHeight: 1.4,
  },
  card: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: "20px",
    padding: "32px",
    position: "relative",
    overflowY: "auto",
    minHeight: "760px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
  },
  cardAccessible: {
    padding: "36px",
  },
  logoutButton: {
    position: "absolute",
    top: "18px",
    right: "18px",
    border: "2px solid #111827",
    backgroundColor: "#f3f4f6",
    color: "#111827",
    borderRadius: "10px",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: "700",
  },
  topControls: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginBottom: "26px",
  },
  topControlsAccessible: {
    gap: "18px",
  },
  modeRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    padding: "18px",
    borderRadius: "18px",
    backgroundColor: "#f8fafc",
    border: "1px solid #d1d5db",
  },
  accessibilityRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    padding: "18px",
    borderRadius: "18px",
    backgroundColor: "#f8fafc",
    border: "1px solid #d1d5db",
  },
  accessibilityTextBlock: {
    flex: 1,
    minWidth: "240px",
  },
  accessibilityButton: {
    border: "none",
    borderRadius: "999px",
    padding: "10px 16px",
    fontWeight: "700",
    fontSize: "13px",
    cursor: "pointer",
    backgroundColor: "#e5e7eb",
    color: "#111827",
  },
  accessibilityButtonActive: {
    backgroundColor: "#111827",
    color: "white",
  },
  accessibilityButtonInactive: {
    backgroundColor: "#ffffff",
    color: "#111827",
  },
  modeTextBlock: {
    flex: 1,
    minWidth: "240px",
  },
  modeEyebrow: {
    margin: 0,
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#374151",
  },
  modeTitle: {
    margin: "6px 0 4px 0",
    fontSize: "22px",
    color: "#111827",
  },
  modeSubtitle: {
    margin: 0,
    color: "#374151",
    lineHeight: 1.5,
    fontSize: "14px",
  },
  modeSwitch: {
    display: "flex",
    backgroundColor: "#e5e7eb",
    borderRadius: "999px",
    padding: "4px",
    gap: "4px",
  },
  modeButton: {
    border: "2px solid transparent",
    borderRadius: "999px",
    padding: "12px 18px",
    fontWeight: "800",
    cursor: "pointer",
    fontSize: "14px",
  },
  modeButtonActive: {
    backgroundColor: "#111827",
    color: "white",
  },
  modeButtonInactive: {
    backgroundColor: "transparent",
    color: "#111827",
  },
  title: {
    fontSize: "30px",
    textAlign: "center",
    color: "#111827",
    marginBottom: "8px",
  },
  titleAccessible: {
    fontSize: "34px",
  },
  subtitle: {
    textAlign: "center",
    color: "#374151",
    maxWidth: "760px",
    margin: "0 auto 26px auto",
    lineHeight: 1.6,
    fontSize: "15px",
  },
  subtitleAccessible: {
    fontSize: "17px",
    lineHeight: 1.7,
  },
  section: {
    marginTop: "24px",
  },
  label: {
    fontWeight: "700",
    color: "#111827",
    marginBottom: "10px",
  },
  labelAccessible: {
    fontSize: "18px",
    marginBottom: "12px",
  },
  buttonGroup: {
    display: "flex",
    gap: "12px",
  },
  buttonGroupAccessible: {
    gap: "16px",
    flexWrap: "wrap",
  },
  optionButton: {
    flex: 1,
    padding: "14px",
    borderRadius: "999px",
    border: "2px solid transparent",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "15px",
  },
  optionButtonActive: {
    backgroundColor: "#4338ca",
    color: "white",
  },
  optionButtonInactive: {
    backgroundColor: "#e5e7eb",
    color: "#111827",
  },
  mainButton: {
    width: "100%",
    marginTop: "22px",
    padding: "14px", // fixed
    borderRadius: "999px",
    border: "2px solid #111827",
    backgroundColor: "#111827",
    color: "white",
    fontWeight: "800",
    fontSize: "15px", // fixed
    cursor: "pointer",
  },
  largeActionButton: {
    minHeight: "56px",
    fontSize: "16px",
    padding: "14px 20px",
  },
  readAloudRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  readAloudRowAccessible: {
    gap: "16px",
  },
  readAloudButton: {
    border: "2px solid #111827",
    backgroundColor: "#ffffff",
    color: "#111827",
    borderRadius: "999px",
    padding: "10px 16px",
    fontWeight: "800",
    cursor: "pointer",
  },
  lastUpdatedText: {
    color: "#4b5563",
    fontWeight: "700",
  },
  resultCard: {
    marginTop: "24px",
    padding: "22px",
    borderRadius: "16px",
    backgroundColor: "#f9fafb",
    border: "1px solid #d1d5db",
  },
  resultCardAccessible: {
    padding: "26px",
  },
  pressure: {
    fontSize: "12px",
    color: "#4b5563",
    marginBottom: "8px",
    fontWeight: "700",
  },
  advice: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#111827",
    margin: "8px 0",
    lineHeight: 1.4,
  },
  adviceAccessible: {
    fontSize: "28px",
    lineHeight: 1.5,
  },
  savings: {
    color: "#166534",
    fontWeight: "800",
    fontSize: "18px",
    marginTop: "10px",
  },
  savingsAccessible: {
    fontSize: "22px",
  },
  error: {
    color: "#b91c1c",
    marginTop: "14px",
    fontWeight: "700",
  },
  errorAccessible: {
    fontSize: "17px",
  },
  emptyState: {
    marginTop: "18px",
    color: "#4b5563",
    lineHeight: 1.6,
    fontWeight: "700",
  },
  emptyStateAccessible: {
    fontSize: "17px",
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginTop: "8px",
    marginBottom: "24px",
  },
  metricCard: {
    backgroundColor: "#f8fafc",
    border: "1px solid #d1d5db",
    borderRadius: "16px",
    padding: "18px",
  },
  metricLabel: {
    fontSize: "13px",
    color: "#4b5563",
    fontWeight: "700",
    marginBottom: "8px",
  },
  metricValue: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#111827",
    margin: 0,
  },
  metricValueSmall: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#111827",
    margin: 0,
  },
  largeCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #d1d5db",
    borderRadius: "18px",
    padding: "22px",
    marginTop: "18px",
  },
  cardHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "8px",
  },
  sectionTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "20px",
    fontWeight: "800",
  },
  yellowBadge: {
    backgroundColor: "#fef3c7",
    color: "#78350f",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    border: "1px solid #d97706",
  },
  blueBadge: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    border: "1px solid #2563eb",
  },
  redBadge: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    border: "1px solid #dc2626",
  },
  chart: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "14px",
    height: "240px",
    marginTop: "20px",
    paddingTop: "10px",
  },
  barWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    flex: 1,
    minWidth: 0,
  },
  bar: {
    borderRadius: "8px 8px 0 0",
  },
  barValue: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#1f2937",
    marginTop: "8px",
  },
  barLabel: {
    marginTop: "6px",
    fontSize: "11px",
    color: "#4b5563",
    fontWeight: "700",
  },
  chartSummary: {
    marginTop: "16px",
    color: "#111827",
    lineHeight: 1.6,
    fontSize: "14px",
    fontWeight: "700",
  },
  chartSummaryAccessible: {
    fontSize: "16px",
    lineHeight: 1.7,
  },
  legend: {
    display: "flex",
    gap: "20px",
    marginTop: "18px",
    flexWrap: "wrap",
  },
  legendRow: {
    display: "flex",
    gap: "20px",
    marginTop: "18px",
    flexWrap: "wrap",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "#1f2937",
    fontWeight: "700",
  },
  legendDot: {
    width: "12px",
    height: "12px",
    borderRadius: "999px",
    display: "inline-block",
  },
  dualGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "18px",
  },
  dashboardText: {
    color: "#1f2937",
    lineHeight: 1.7,
    fontSize: "15px",
    marginTop: "10px",
  },
  techList: {
    margin: "12px 0 0 18px",
    color: "#1f2937",
    lineHeight: 1.8,
    fontSize: "15px",
    padding: 0,
  },

  dashboardWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  heroCard: {
    backgroundColor: "#f8fafc",
    border: "1px solid #d1d5db",
    borderRadius: "20px",
    padding: "24px",
  },
  heroHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
  },
  pageTitle: {
    margin: 0,
    fontSize: "30px",
    fontWeight: "800",
    color: "#111827",
  },
  pageSubtitle: {
    margin: "8px 0 0 0",
    color: "#374151",
    fontSize: "16px",
    lineHeight: 1.6,
    maxWidth: "760px",
  },
  liveBadge: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
    padding: "10px 14px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    border: "1px solid #2563eb",
    whiteSpace: "nowrap",
  },
  leadText: {
    marginTop: "16px",
    marginBottom: 0,
    color: "#1f2937",
    lineHeight: 1.8,
    fontSize: "15px",
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #d1d5db",
    borderRadius: "18px",
    padding: "22px",
  },
  cardGrid4: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "16px",
    marginTop: "16px",
  },
  cardGrid5: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "16px",
    marginTop: "16px",
  },
  metricSubtext: {
    fontSize: "12px",
    color: "#6b7280",
    marginTop: "8px",
    lineHeight: 1.5,
    fontWeight: "600",
  },
  flowRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    alignItems: "center",
    marginTop: "16px",
  },
  flowStepWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  flowStep: {
    backgroundColor: "#eef2ff",
    color: "#312e81",
    border: "1px solid #c7d2fe",
    borderRadius: "14px",
    padding: "12px 14px",
    fontWeight: "700",
    fontSize: "13px",
    lineHeight: 1.5,
  },
  flowArrow: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#475569",
  },
  flowColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "16px",
    alignItems: "center",
  },
  flowArrowDown: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#475569",
    lineHeight: 1,
  },
  explainerText: {
    marginTop: "16px",
    marginBottom: 0,
    color: "#1f2937",
    lineHeight: 1.8,
    fontSize: "15px",
  },
  chartCard: {
    marginTop: "16px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "18px",
  },
  lineChart: {
    width: "100%",
    height: "260px",
    background: "linear-gradient(to bottom, #ffffff, #f8fafc)",
    borderRadius: "14px",
    border: "1px solid #e5e7eb",
    display: "block",
    overflow: "visible",
  },
  twoColumnGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "18px",
  },
  logicBox: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "16px",
  },
  logicRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    padding: "14px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
  },
  logicLabel: {
    color: "#1f2937",
    fontSize: "14px",
    fontWeight: "700",
    lineHeight: 1.6,
    flex: 1,
    minWidth: "180px",
  },
  logicBadge: {
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    minWidth: "74px",
    textAlign: "center",
  },
  infoPanel: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "18px",
  },
  infoPanelTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "17px",
    fontWeight: "800",
  },
  infoList: {
    margin: "12px 0 0 18px",
    padding: 0,
    color: "#1f2937",
    lineHeight: 1.8,
    fontSize: "14px",
    fontWeight: "600",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "14px",
    minHeight: "48px", // ADD THIS
  },
  accessibilityButton: {
    border: "none",
    borderRadius: "999px",
    padding: "10px 16px",
    fontWeight: "700",
    fontSize: "13px",
    cursor: "pointer",
    backgroundColor: "#e5e7eb", // SAME as your inactive buttons
    color: "#111827",
    transition: "0.2s ease",
  },

  accessibilityOn: {
    backgroundColor: "#4f46e5", // SAME as active tab / system colour
    color: "white",
  },

  modeToggle: {
    display: "flex",
    gap: "10px",
    fontSize: "14px",
    cursor: "pointer",
  },

  activeMode: {
    fontWeight: "bold",
    textDecoration: "underline",
  },

  inactiveMode: {
    opacity: 0.5,
  },
  usageCard: {
    marginTop: "20px",
    padding: "18px",
    borderRadius: "16px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e5e7eb",
  },

  usageLabel: {
    fontWeight: "700",
    color: "#111827",
    marginBottom: "10px",
  },

  usageBadge: {
    display: "inline-block",
    padding: "10px 16px",
    borderRadius: "999px",
    fontWeight: "800",
    fontSize: "14px",
  },
};

export default App;
