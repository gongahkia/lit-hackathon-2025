"use client"

import { useState } from "react"
import { Calculator, Info, FileText, AlertCircle, ExternalLink } from "lucide-react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Alert, AlertDescription } from "../ui/alert"
import { Separator } from "../ui/separator"

export default function LABCalculator() {
  const [salary, setSalary] = useState("")
  const [results, setResults] = useState(null)
  const [calculationHistory, setCalculationHistory] = useState([])

  // LAB eBantu formulas from the PRD
  const calculateLABValues = (salaryAmount) => {
    const s = Number.parseFloat(salaryAmount)
    if (isNaN(s) || s <= 0) return null

    // Iddah calculation: 0.14 * salary + 47
    const iddahMonth = 0.14 * s + 47
    const iddahLower = Math.max(0, 0.14 * s - 3)
    const iddahUpper = 0.14 * s + 197

    // Mutaah calculation: 0.00096 * salary + 0.85
    const mutaahDay = 0.00096 * s + 0.85
    const mutaahLower = 0.00096 * s - 0.15
    const mutaahUpper = 0.00096 * s + 1.85

    return {
      salary: s,
      iddah: {
        value: iddahMonth,
        lower: iddahLower,
        upper: iddahUpper,
        formula: "0.14 × salary + 47",
        rounded: Math.round(iddahMonth),
      },
      mutaah: {
        value: mutaahDay,
        lower: mutaahLower,
        upper: mutaahUpper,
        formula: "0.00096 × salary + 0.85",
        rounded: Math.round(mutaahDay * 100) / 100,
      },
      calculatedAt: new Date().toISOString(),
      calculationId: Math.random().toString(36).slice(2),
    }
  }

  const handleCalculate = () => {
    const result = calculateLABValues(salary)
    if (result) {
      setResults(result)
      setCalculationHistory((prev) => [result, ...prev.slice(0, 4)]) // Keep last 5 calculations
    }
  }

  const handleClear = () => {
    setSalary("")
    setResults(null)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-SG", {
      style: "currency",
      currency: "SGD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-SG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Calculator className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-semibold">LAB eBantu Calculator</h1>
          </div>

          <p className="text-muted-foreground mb-4">
            Legal Aid Bureau calculation tool for Iddah and Mutaah estimates based on salary input. This tool provides
            estimates only and should not be considered as legal advice.
          </p>

          <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              <strong>Important:</strong> These calculations are estimates only and do not constitute legal advice.
              Please consult with a qualified legal professional for official determinations.
            </AlertDescription>
          </Alert>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calculator Input */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Salary Input</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="salary">Monthly Salary (SGD)</Label>
                  <Input
                    id="salary"
                    type="number"
                    placeholder="Enter monthly salary"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="mt-1"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the monthly salary amount in Singapore Dollars
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCalculate}
                    disabled={!salary || Number.parseFloat(salary) <= 0}
                    className="flex-1"
                  >
                    Calculate
                  </Button>
                  <Button variant="outline" onClick={handleClear}>
                    Clear
                  </Button>
                </div>

                {/* Quick Examples */}
                <div>
                  <Label className="text-sm">Quick Examples:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[1500, 3000, 5000, 8000].map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => setSalary(amount.toString())}
                        className="text-xs"
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Calculation History */}
            {calculationHistory.length > 0 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-base">Recent Calculations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {calculationHistory.map((calc) => (
                      <div
                        key={calc.calculationId}
                        className="flex items-center justify-between p-2 bg-muted rounded cursor-pointer hover:bg-muted/80"
                        onClick={() => {
                          setSalary(calc.salary.toString())
                          setResults(calc)
                        }}
                      >
                        <div>
                          <p className="text-sm font-medium">{formatCurrency(calc.salary)}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(calc.calculatedAt)}</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          Load
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            {results ? (
              <div className="space-y-6">
                {/* Calculation Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Calculation Results</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Based on monthly salary of {formatCurrency(results.salary)}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Iddah Calculation */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-primary mb-2">Iddah (Monthly)</h3>
                          <div className="text-3xl font-bold mb-2">{formatCurrency(results.iddah.rounded)}</div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Precise value: {formatCurrency(results.iddah.value)}
                          </p>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Lower bound:</span>
                              <span className="font-medium">{formatCurrency(results.iddah.lower)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Upper bound:</span>
                              <span className="font-medium">{formatCurrency(results.iddah.upper)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Formula Used:</p>
                          <code className="text-sm">{results.iddah.formula}</code>
                        </div>
                      </div>

                      {/* Mutaah Calculation */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-secondary mb-2">Mutaah (Daily)</h3>
                          <div className="text-3xl font-bold mb-2">{formatCurrency(results.mutaah.rounded)}</div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Precise value: {formatCurrency(results.mutaah.value)}
                          </p>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Lower bound:</span>
                              <span className="font-medium">{formatCurrency(results.mutaah.lower)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Upper bound:</span>
                              <span className="font-medium">{formatCurrency(results.mutaah.upper)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Formula Used:</p>
                          <code className="text-sm">{results.mutaah.formula}</code>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Calculation Metadata */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Calculation Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <label className="font-medium text-muted-foreground">Calculation ID</label>
                        <p className="font-mono text-xs mt-1">{results.calculationId}</p>
                      </div>
                      <div>
                        <label className="font-medium text-muted-foreground">Calculated At</label>
                        <p className="mt-1">{formatDate(results.calculatedAt)}</p>
                      </div>
                      <div>
                        <label className="font-medium text-muted-foreground">Formula Version</label>
                        <p className="mt-1">LAB eBantu v1.0</p>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>Source: LAB eBantu calculation logic as specified in official documentation</span>
                      <Button variant="link" size="sm" className="p-0 h-auto text-primary">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Source
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Export Options */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Export & Share</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm">
                        <FileText className="h-3 w-3 mr-1" />
                        Export PDF
                      </Button>
                      <Button variant="outline" size="sm">
                        Copy Results
                      </Button>
                      <Button variant="outline" size="sm">
                        Share Link
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calculator className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                  <h3 className="text-lg font-medium mb-3">LAB eBantu Calculator</h3>
                  <p className="text-muted-foreground max-w-md mx-auto leading-relaxed mb-6">
                    Enter a monthly salary amount to calculate Iddah and Mutaah estimates according to Legal Aid Bureau
                    formulas.
                  </p>

                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Iddah Calculation</h4>
                        <p className="text-muted-foreground">Monthly maintenance during waiting period</p>
                        <code className="text-xs mt-2 block">Formula: 0.14 × salary + 47</code>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Mutaah Calculation</h4>
                        <p className="text-muted-foreground">Daily compensation amount</p>
                        <code className="text-xs mt-2 block">Formula: 0.00096 × salary + 0.85</code>
                      </div>
                    </div>

                    <Alert className="text-left">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        All calculations include lower and upper bounds as specified in the LAB eBantu documentation.
                        Results are provided for estimation purposes only.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
