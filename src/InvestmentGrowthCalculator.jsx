import React, { useState, useCallback, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Slider } from "./components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Switch } from "./components/ui/switch";
import { Button } from "./components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Trash, HelpCircle, ChevronDown } from "lucide-react";

const defaultAssets = {
  "Baseline (No Scenario)": {
    return: 0,
    volatility: 0,
    drawdownImpact: 0,
    color: "#000000",
    isBaseline: true,
    crisisSensitivity: 0,
  },
  "BIL (Short-Term Treasuries)": {
    return: 3,
    volatility: 0.02,
    drawdownImpact: 0.1,
    color: "#8884d8",
    isBaseline: false,
    crisisSensitivity: 0.1,
  },
  "KMLM (Managed Futures)": {
    return: 4,
    volatility: 0.08,
    drawdownImpact: 0.3,
    color: "#82ca9d",
    isBaseline: false,
    crisisSensitivity: 0.5,
  },
  "SPHD (High-Dividend/Low-Vol)": {
    return: 6,
    volatility: 0.12,
    drawdownImpact: 0.7,
    color: "#ffc658",
    isBaseline: false,
    crisisSensitivity: 0.8,
  },
  "SWPPX/SPX (S&P 500)": {
    return: 7,
    volatility: 0.15,
    drawdownImpact: 1.0,
    color: "#ff7300",
    isBaseline: false,
    crisisSensitivity: 1.0,
  },
  "PFF (Preferred Stocks)": {
    return: 4,
    volatility: 0.1,
    drawdownImpact: 0.8,
    color: "#00C49F",
    isBaseline: false,
    crisisSensitivity: 0.9,
  },
  "VUG (Large-Cap Growth)": {
    return: 7,
    volatility: 0.18,
    drawdownImpact: 1.2,
    color: "#0088FE",
    isBaseline: false,
    crisisSensitivity: 1.2,
  },
};

const metricDefinitions = {
  crisisImpact: {
    title: "Crisis Impact Calculation",
    description: "How the model calculates an asset's behavior during a crisis scenario. Combines crisis sensitivity and drawdown impact to determine the total loss.",
    formula: "Total Loss = Market Drawdown × Crisis Sensitivity × Drawdown Impact",
    variables: {
      "Market Drawdown": "The overall crisis severity (e.g., 40%)",
      "Crisis Sensitivity": "How much of the crisis affects this asset (0-2)",
      "Drawdown Impact": "Asset's vulnerability to the scaled crisis (0-2)"
    }
  },
  recoveryPath: {
    title: "Recovery & Permanent Damage",
    description: "After a crisis, assets recover towards a permanently reduced target based on their sensitivity and recovery pattern.",
    formula: "Recovery Target = No-Crisis Value × (1 - Permanent Damage Ratio)",
    variables: {
      "No-Crisis Value": "What the asset would be worth without any crisis",
      "Permanent Damage": "Lasting impact (40% of initial drawdown)",
      "Recovery Pattern": "V-shaped (fast), U-shaped (medium), or L-shaped (slow)"
    }
  },
  realReturns: {
    title: "Real Returns After Fees & Inflation",
    description: "All returns are adjusted for the erosion of purchasing power and costs over time.",
    formula: "Adjusted Value = Nominal Value / (1 + Fees + Inflation)^Year",
    variables: {
      "Nominal Value": "Raw asset value before adjustments",
      "Fees": "Annual investment costs (%)",
      "Inflation": "Annual purchasing power loss (%)",
      "Year": "Number of years from start"
    }
  }
};

const InvestmentGrowthCalculator = () => {
  const defaultInitialAmount = 100000;
  const defaultYears = 5;
  const defaultEnableRisk = false;
  const defaultCrisisType = "NONE";
  const defaultDrawdown = 0;
  const defaultRecoveryYears = 1;
  const defaultRecoveryType = "V_SHAPED";
  const defaultVolatilityLevel = 1;
  const defaultRandomSeedBase = 1;
  const defaultEnableVolatility = false;
  const [annualFees, setAnnualFees] = useState(0);
  const [inflationRate, setInflationRate] = useState(2.5);

  const [initialAmount, setInitialAmount] = useState(defaultInitialAmount);
  const [years, setYears] = useState(defaultYears);
  const [enableRisk, setEnableRisk] = useState(defaultEnableRisk);
  const [crisisType, setCrisisType] = useState(defaultCrisisType);
  const [drawdown, setDrawdown] = useState(defaultDrawdown);
  const [recoveryYears, setRecoveryYears] = useState(defaultRecoveryYears);
  const [recoveryType, setRecoveryType] = useState(defaultRecoveryType);
  const [volatilityLevel, setVolatilityLevel] = useState(
    defaultVolatilityLevel
  );
  const [randomSeedBase, setRandomSeedBase] = useState(defaultRandomSeedBase);
  const [enableVolatility, setEnableVolatility] = useState(
    defaultEnableVolatility
  );
  const [assets, setAssets] = useState(defaultAssets);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [isMetricsExpanded, setIsMetricsExpanded] = useState(false);

  const randomFactors = useMemo(() => {
    let seed = randomSeedBase;
    const seededRandom = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const normalRandom = () => {
      const u1 = seededRandom();
      const u2 = seededRandom();
      return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    };
    const factors = {};
    Object.entries(assets).forEach(([name, asset]) => {
      if (asset.isBaseline) {
        factors[name] = Array(years + 1).fill(0);
      } else {
        factors[name] = Array(years + 1)
          .fill(0)
          .map(() => normalRandom() * asset.volatility * volatilityLevel);
      }
    });
    return factors;
  }, [randomSeedBase, years, volatilityLevel, assets]);

  const baselineData = useMemo(() => {
    const data = [];
    for (let yearIndex = 0; yearIndex <= years; yearIndex++) {
      const dataPoint = { year: `Year ${yearIndex}` };
      dataPoint["Baseline (No Scenario)"] = parseFloat(
        initialAmount.toFixed(2)
      );

      Object.entries(assets).forEach(([name, asset]) => {
        if (asset.isBaseline) return;
        let value = initialAmount;
        for (let y = 1; y <= yearIndex; y++) {
          value *= 1 + asset.return / 100;
        }
        dataPoint[name] = parseFloat(value.toFixed(2));
      });
      data.push(dataPoint);
    }
    return data;
  }, [initialAmount, years, assets]);

  const scenarioData = useMemo(() => {
    const scenario = JSON.parse(JSON.stringify(baselineData));
    const combinedAnnualDrag = (annualFees + inflationRate) / 100;

    // First apply inflation and fees to all scenarios
    for (let yearIndex = 1; yearIndex <= years; yearIndex++) {
      Object.entries(assets).forEach(([name, asset]) => {
        if (asset.isBaseline) return;
        scenario[yearIndex][name] = scenario[yearIndex][name] / Math.pow(1 + combinedAnnualDrag, yearIndex);
      });
    }

    if (enableRisk && crisisType !== "NONE") {
      Object.entries(assets).forEach(([name, asset]) => {
        if (asset.isBaseline) return;
        
        // Apply crisis sensitivity to drawdown impact
        const crisisSensitivity = asset.crisisSensitivity || 1;
        const drawdownImpactDecimal = (drawdown / 100) * asset.drawdownImpact * crisisSensitivity;

        // More conservative permanent damage based on crisis severity and asset sensitivity
        const permanentDamageRatio = (() => {
          const baseDamage = drawdownImpactDecimal * 0.4; // 40% of drawdown becomes permanent
          const sensitivityAdjustedDamage = baseDamage * crisisSensitivity;
          
          switch (crisisType) {
            case "RISK_OFF":
              return 0.90 - sensitivityAdjustedDamage; // Risk-off crises have 90% recovery potential
            case "RISING_RATES":
              // Adjust impact based on asset type (e.g., bonds are more sensitive to rates)
              const ratesSensitivity = crisisType === "RISING_RATES" ? Math.min(1.5 * crisisSensitivity, 1) : crisisSensitivity;
              return 0.85 - sensitivityAdjustedDamage * ratesSensitivity;
            default:
              return 0.95 - sensitivityAdjustedDamage;
          }
        })();

        // Apply initial drawdown
        if (years >= 1) {
          const year1Value = scenario[1][name];
          scenario[1][name] = year1Value * (1 - drawdownImpactDecimal);
        }

        // Calculate reduced growth rate for post-crisis years
        const originalReturn = asset.return;
        const reducedReturn = originalReturn * permanentDamageRatio;

        for (let y = 2; y <= years; y++) {
          const yearValueNoCrisisAdjusted = baselineData[y][name] / Math.pow(1 + combinedAnnualDrag, y);
          const recoveryTarget = yearValueNoCrisisAdjusted * permanentDamageRatio;
          const drawdownValue = scenario[1][name];

          if (y <= recoveryYears + 1) {
            // During recovery period
            const progress = (y - 1) / recoveryYears;
            const exponent = recoveryType === "V_SHAPED" 
              ? 0.5  // Faster initial recovery
              : recoveryType === "U_SHAPED" 
                ? 1.5 // Slower initial recovery
                : 3;  // Very slow initial recovery for L-shaped
            const recoveryFactor = Math.pow(progress, exponent);
            
            // Calculate recovery value but ensure it doesn't exceed the damage-adjusted target
            scenario[y][name] = Math.min(
              drawdownValue + (recoveryTarget - drawdownValue) * recoveryFactor,
              recoveryTarget
            );
          } else {
            // Post-recovery period: grow at reduced rate
            scenario[y][name] = scenario[y-1][name] * (1 + reducedReturn / 100);
            // Cap growth to never exceed the permanent damage adjusted target
            if (scenario[y][name] > recoveryTarget) {
              scenario[y][name] = recoveryTarget;
            }
          }
        }
      });
    }

    // Apply volatility after all other calculations
    if (enableVolatility) {
      for (let yearIndex = 1; yearIndex <= years; yearIndex++) {
        Object.entries(assets).forEach(([name, asset]) => {
          if (asset.isBaseline) return;
          scenario[yearIndex][name] = parseFloat(
            (
              scenario[yearIndex][name] *
              (1 + randomFactors[name][yearIndex])
            ).toFixed(2)
          );
        });
      }
    }

    const summaryMetrics = {};
    Object.entries(assets).forEach(([name, asset]) => {
      if (asset.isBaseline) return;
      const startValue = scenario[0][name];
      const endValue = scenario[years][name];
      const cagr = (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
      
      const returns = [];
      for (let y = 1; y <= years; y++) {
        const yearReturn = (scenario[y][name] - scenario[y-1][name]) / scenario[y-1][name];
        returns.push(yearReturn);
      }
      const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / returns.length;
      const volatility = Math.sqrt(variance) * 100;

      let maxDrawdown = 0;
      let peak = startValue;
      for (let y = 1; y <= years; y++) {
        const currentValue = scenario[y][name];
        if (currentValue > peak) {
          peak = currentValue;
        }
        const drawdown = (peak - currentValue) / peak * 100;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }

      summaryMetrics[name] = {
        cagr: parseFloat(cagr.toFixed(2)),
        volatility: parseFloat(volatility.toFixed(2)),
        maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
      };
    });

    return { data: scenario, metrics: summaryMetrics };
  }, [
    baselineData,
    enableRisk,
    crisisType,
    drawdown,
    recoveryYears,
    recoveryType,
    enableVolatility,
    randomFactors,
    years,
    assets,
    annualFees,
    inflationRate,
    ...Object.values(assets).map(asset => asset.drawdownImpact),
    ...Object.values(assets).map(asset => asset.return),
    ...Object.values(assets).map(asset => asset.volatility),
  ]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const resetParameters = useCallback(() => {
    setInitialAmount(defaultInitialAmount);
    setYears(defaultYears);
    setEnableRisk(defaultEnableRisk);
    setCrisisType(defaultCrisisType);
    setDrawdown(defaultDrawdown);
    setRecoveryYears(defaultRecoveryYears);
    setRecoveryType(defaultRecoveryType);
    setVolatilityLevel(defaultVolatilityLevel);
    setRandomSeedBase(defaultRandomSeedBase);
    setEnableVolatility(defaultEnableVolatility);
    setAssets(defaultAssets);
    setSelectedPreset("");
  }, []);

  const handleAssetChange = (name, field, value) => {
    setAssets((prev) => {
      const updated = { ...prev };
      updated[name] = { ...updated[name], [field]: value };
      return updated;
    });
  };

  const handleAddAsset = () => {
    const newName = `New Asset ${Object.keys(assets).length}`;
    setAssets((prev) => ({
      ...prev,
      [newName]: {
        return: 5,
        volatility: 0.1,
        drawdownImpact: 0.5,
        color: "#999999",
        isBaseline: false,
        crisisSensitivity: 1.0,
      },
    }));
  };

  const handleRemoveAsset = (name) => {
    if (assets[name].isBaseline) return;
    const updated = { ...assets };
    delete updated[name];
    setAssets(updated);
  };

  const scenarioPresets = {
    "Nada": {
      enableRisk: false,
      crisisType: "NONE",
      drawdown: 0,
      recoveryYears: 1,
      recoveryType: "V_SHAPED",
      enableVolatility: false,
      volatilityLevel: 1,
    },
    "Mild Recession": {
      enableRisk: true,
      crisisType: "RISK_OFF",
      drawdown: 20,
      recoveryYears: 2,
      recoveryType: "V_SHAPED",
      enableVolatility: true,
      volatilityLevel: 1,
    },
    "Severe Crisis": {
      enableRisk: true,
      crisisType: "RISK_OFF",
      drawdown: 40,
      recoveryYears: 4,
      recoveryType: "U_SHAPED",
      enableVolatility: true,
      volatilityLevel: 1.5,
    },
    "Rising Rates Shock": {
      enableRisk: true,
      crisisType: "RISING_RATES",
      drawdown: 25,
      recoveryYears: 3,
      recoveryType: "L_SHAPED",
      enableVolatility: true,
      volatilityLevel: 1.2,
    },
    "Steady Growth": {
      enableRisk: false,
      crisisType: "NONE",
      drawdown: 0,
      recoveryYears: 1,
      recoveryType: "V_SHAPED",
      enableVolatility: false,
      volatilityLevel: 1,
    },
  };

  const applyScenarioPreset = (presetName) => {
    const preset = scenarioPresets[presetName];
    setEnableRisk(preset.enableRisk);
    setCrisisType(preset.crisisType);
    setDrawdown(preset.drawdown);
    setRecoveryYears(preset.recoveryYears);
    setRecoveryType(preset.recoveryType);
    setEnableVolatility(preset.enableVolatility);
    setVolatilityLevel(preset.volatilityLevel);
    setSelectedPreset(presetName);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Investment Growth Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="h-96">
            <ResponsiveContainer>
              <LineChart
                data={scenarioData.data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                {Object.entries(assets).map(([name, asset]) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={asset.color}
                    dot={false}
                    strokeWidth={name === "Baseline (No Scenario)" ? 3 : 2}
                    strokeDasharray={asset.isBaseline ? "5 5" : "0"}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <Label>Initial Investment</Label>
              <Input
                type="number"
                value={initialAmount}
                onChange={(e) =>
                  setInitialAmount(Math.max(0, Number(e.target.value)))
                }
              />
            </div>
            <div>
              <Label>Years</Label>
              <Input
                type="number"
                value={years}
                onChange={(e) =>
                  setYears(Math.max(1, Math.min(30, Number(e.target.value))))
                }
              />
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="flex justify-between items-center gap-4">
              <Label className="font-semibold w-36">Scenario Preset</Label>
              <Select
                value={selectedPreset}
                onValueChange={applyScenarioPreset}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a scenario..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(scenarioPresets).map((preset) => (
                    <SelectItem key={preset} value={preset}>
                      {preset}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex justify-between">
                <Label>Annual Fees</Label>
                <span>{annualFees.toFixed(2)}%</span>
              </div>
              <Slider
                value={[annualFees]}
                min={0}
                max={3}
                step={0.1}
                onValueChange={(v) => setAnnualFees(v[0])}
              />
            </div>

            <div>
              <div className="flex justify-between">
                <Label>Inflation Rate</Label>
                <span>{inflationRate.toFixed(2)}%</span>
              </div>
              <Slider
                value={[inflationRate]}
                min={0}
                max={10}
                step={0.5}
                onValueChange={(v) => setInflationRate(v[0])}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Enable Risk Scenario</Label>
              <Switch checked={enableRisk} onCheckedChange={setEnableRisk} />
            </div>

            {enableRisk && (
              <div className="space-y-4">
                <div className="flex justify-between items-center gap-4">
                  <div className="flex-1">
                    <Label>Crisis Type</Label>
                    <Select value={crisisType} onValueChange={setCrisisType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">None</SelectItem>
                        <SelectItem value="RISK_OFF">
                          Risk-Off Crisis
                        </SelectItem>
                        <SelectItem value="RISING_RATES">
                          Rising Rates Crisis
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="relative group h-[40px] flex items-end">
                    <Button
                      variant="outline"
                      className="whitespace-nowrap"
                      onClick={() =>
                        setRandomSeedBase(Math.floor(Math.random() * 1000000))
                      }
                    >
                      Random Seed
                    </Button>
                    <div className="absolute bottom-full mb-2 hidden group-hover:block right-0 w-64 p-2 bg-white border rounded-lg shadow-lg z-50 text-sm">
                      Generates a new random pattern for asset volatility. 
                      Use this to see how different random market movements affect the outcomes while keeping other settings the same.
                    </div>
                  </div>
                </div>

                {crisisType !== "NONE" && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between">
                        <Label>Market Drawdown</Label>
                        <span>{drawdown}%</span>
                      </div>
                      <Slider
                        value={[drawdown]}
                        min={0}
                        max={50}
                        step={1}
                        onValueChange={(v) => setDrawdown(v[0])}
                      />
                    </div>

                    <div>
                      <Label>Recovery Pattern</Label>
                      <Select
                        value={recoveryType}
                        onValueChange={setRecoveryType}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="V_SHAPED">V-Shaped</SelectItem>
                          <SelectItem value="U_SHAPED">U-Shaped</SelectItem>
                          <SelectItem value="L_SHAPED">L-Shaped</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <div className="flex justify-between">
                        <Label>Recovery Period</Label>
                        <span>{recoveryYears} years</span>
                      </div>
                      <Slider
                        value={[recoveryYears]}
                        min={1}
                        max={years}
                        step={0.5}
                        onValueChange={(v) => setRecoveryYears(v[0])}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label>Enable Volatility</Label>
              <Switch
                checked={enableVolatility}
                onCheckedChange={setEnableVolatility}
              />
            </div>
            {enableVolatility && (
              <div>
                <div className="flex justify-between">
                  <Label>Volatility Level</Label>
                  <span>{volatilityLevel}x</span>
                </div>
                <Slider
                  value={[volatilityLevel]}
                  min={0}
                  max={1.5}
                  step={0.1}
                  onValueChange={(v) => setVolatilityLevel(v[0])}
                />
              </div>
            )}

            <Button variant="outline" onClick={resetParameters}>
              Reset
            </Button>
          </div>

          <div className="mt-6">
            <div
              className="flex items-center gap-2 cursor-pointer select-none"
              onClick={() => setIsMetricsExpanded(!isMetricsExpanded)}
            >
              <ChevronDown
                className={`h-5 w-5 transition-transform ${
                  isMetricsExpanded ? "transform rotate-180" : ""
                }`}
              />
              <h3 className="text-lg font-semibold">Summary Metrics</h3>
              <div className="relative group">
                <HelpCircle className="h-5 w-5 text-gray-400 cursor-help" />
                <div className="absolute left-0 top-full mt-2 hidden group-hover:block w-96 p-4 bg-white border rounded-lg shadow-lg z-50">
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium">CAGR (Compound Annual Growth Rate)</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        The average yearly return you would have earned if your investment grew at a steady rate.
                        For example, if $100 grows to $150 over 5 years, the CAGR is about 8.45% per year.
                      </p>
                      <p className="text-sm text-blue-600 mt-2">
                        <strong>How does this help:</strong> CAGR lets you compare investments over different time periods 
                        on an equal basis. It helps you understand if an investment is meeting your long-term growth targets, 
                        regardless of short-term ups and downs.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">Volatility</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        How much the investment's returns bounce up and down over time.
                        Lower volatility (like 5%) means steadier returns, while higher volatility (like 20%) means bigger swings in value.
                      </p>
                      <p className="text-sm text-blue-600 mt-2">
                        <strong>How does this help:</strong> Volatility helps you gauge if an investment matches your risk tolerance. 
                        Lower volatility assets might be better for short-term goals or if you're close to retirement, 
                        while higher volatility might be acceptable for long-term growth.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">Max Drawdown</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        The biggest drop from peak to bottom. If an investment goes from $100 to $70,
                        that's a 30% drawdown. This shows your worst-case scenario loss if you bought at the highest point and sold at the lowest.
                      </p>
                      <p className="text-sm text-blue-600 mt-2">
                        <strong>How does this help:</strong> Max drawdown reveals how well you could handle market stress. 
                        If you'd panic and sell during a 30% drop, you might want investments with smaller drawdowns. 
                        It's crucial for understanding your true risk capacity.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {isMetricsExpanded && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {Object.entries(scenarioData.metrics).map(([name, metrics]) => (
                  <div key={name} className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">{name}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">CAGR:</span>
                        <span>{metrics.cagr.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Volatility:</span>
                        <span>{metrics.volatility.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max Drawdown:</span>
                        <span>{metrics.maxDrawdown.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <Label className="font-semibold">Assets Configuration</Label>
              <Button variant="outline" onClick={handleAddAsset}>
                Add Asset
              </Button>
            </div>
            <div className="overflow-auto mt-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-1">Name</th>
                    <th className="py-2 px-1">Return (%)</th>
                    <th className="py-2 px-1">Volatility</th>
                    <th className="py-2 px-1">Drawdown Impact</th>
                    <th className="py-2 px-1">Crisis Sensitivity</th>
                    <th className="py-2 px-1">Color (Hex)</th>
                    <th className="py-2 px-1">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(assets).map(([name, asset]) => (
                    <tr key={name} className="border-b">
                      <td className="py-1 px-1">
                        {asset.isBaseline ? (
                          <span>{name}</span>
                        ) : (
                          <Input
                            value={name}
                            onChange={(e) => {
                              const newName = e.target.value;
                              setAssets((prev) => {
                                const updated = { ...prev };
                                const oldAsset = updated[name];
                                delete updated[name];
                                updated[newName] = oldAsset;
                                return updated;
                              });
                            }}
                          />
                        )}
                      </td>
                      <td className="py-1 px-1">
                        {asset.isBaseline ? (
                          <span>0 (Fixed)</span>
                        ) : (
                          <Input
                            type="number"
                            value={asset.return}
                            step="0.1"
                            onChange={(e) =>
                              handleAssetChange(
                                name,
                                "return",
                                Number(e.target.value)
                              )
                            }
                          />
                        )}
                      </td>
                      <td className="py-1 px-1">
                        {asset.isBaseline ? (
                          <span>0 (Fixed)</span>
                        ) : (
                          <Input
                            type="number"
                            value={asset.volatility}
                            step="0.01"
                            onChange={(e) =>
                              handleAssetChange(
                                name,
                                "volatility",
                                Number(e.target.value)
                              )
                            }
                          />
                        )}
                      </td>
                      <td className="py-1 px-1">
                        {asset.isBaseline ? (
                          <span>0 (Fixed)</span>
                        ) : (
                          <Input
                            type="number"
                            value={asset.drawdownImpact}
                            step="0.1"
                            onChange={(e) =>
                              handleAssetChange(
                                name,
                                "drawdownImpact",
                                Number(e.target.value)
                              )
                            }
                          />
                        )}
                      </td>
                      <td className="py-1 px-1">
                        {asset.isBaseline ? (
                          <span>0 (Fixed)</span>
                        ) : (
                          <Input
                            type="number"
                            value={asset.crisisSensitivity}
                            step="0.1"
                            min="0"
                            max="2"
                            onChange={(e) =>
                              handleAssetChange(
                                name,
                                "crisisSensitivity",
                                Number(e.target.value)
                              )
                            }
                          />
                        )}
                      </td>
                      <td className="py-1 px-1">
                        {asset.isBaseline ? (
                          <span>#000000</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded border"
                              style={{ backgroundColor: asset.color }}
                            />
                            <input
                              type="color"
                              value={asset.color}
                              onChange={(e) =>
                                handleAssetChange(name, "color", e.target.value)
                              }
                              className="w-12 h-8 p-0 cursor-pointer"
                            />
                          </div>
                        )}
                      </td>
                      <td className="py-1 px-1">
                        {asset.isBaseline ? (
                          <span>-</span>
                        ) : (
                          <Button
                            variant="destructive"
                            onClick={() => handleRemoveAsset(name)}
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
      <CardContent>
        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-semibold">Formula Reference</h3>
          <div className="grid grid-cols-1 gap-4">
            {Object.entries(metricDefinitions).map(([key, def]) => (
              <div key={key} className="p-4 border rounded-lg bg-gray-50">
                <h4 className="font-medium text-lg mb-2">{def.title}</h4>
                <p className="text-sm text-gray-600 mb-4">{def.description}</p>
                <div className="bg-white p-3 rounded border mb-4">
                  <code className="text-sm font-mono">{def.formula}</code>
                </div>
                <div className="space-y-2">
                  <h5 className="font-medium">Variables:</h5>
                  {Object.entries(def.variables).map(
                    ([variable, description]) => (
                      <div key={variable} className="flex gap-2 text-sm">
                        <code className="font-mono text-blue-600">
                          {variable}
                        </code>
                        <span className="text-gray-600">-</span>
                        <span className="text-gray-600">{description}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvestmentGrowthCalculator;
