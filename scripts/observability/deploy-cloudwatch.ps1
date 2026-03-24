param(
  [string]$Region = 'us-east-1',
  [string]$LogGroup = '/stellar-pay/production',
  [string]$DashboardName = 'stellar-pay-observability',
  [string]$AlarmTopicArn = '',
  [int]$RetentionDays = 30
)

$ErrorActionPreference = 'Stop'

function Replace-Placeholders {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Content
  )

  return $Content.Replace('__REGION__', $Region).Replace('__LOG_GROUP__', $LogGroup).Replace('__DASHBOARD_NAME__', $DashboardName)
}

Write-Host "Ensuring CloudWatch log group $LogGroup exists in $Region"
$existingGroup = aws logs describe-log-groups --region $Region --log-group-name-prefix $LogGroup | ConvertFrom-Json
if (-not ($existingGroup.logGroups | Where-Object { $_.logGroupName -eq $LogGroup })) {
  aws logs create-log-group --region $Region --log-group-name $LogGroup | Out-Null
}

aws logs put-retention-policy --region $Region --log-group-name $LogGroup --retention-in-days $RetentionDays | Out-Null

$metricFiltersPath = Join-Path $PSScriptRoot '..\..\docs\observability\cloudwatch-metric-filters.json'
$metricFilters = Get-Content $metricFiltersPath -Raw | Replace-Placeholders | ConvertFrom-Json
foreach ($filter in $metricFilters) {
  $transformations = $filter.metricTransformations | ConvertTo-Json -Compress -Depth 10
  aws logs put-metric-filter `
    --region $Region `
    --log-group-name $LogGroup `
    --filter-name $filter.filterName `
    --filter-pattern $filter.filterPattern `
    --metric-transformations $transformations | Out-Null
}

$dashboardPath = Join-Path $PSScriptRoot '..\..\docs\observability\cloudwatch-dashboard.json'
$dashboardBody = Get-Content $dashboardPath -Raw | Replace-Placeholders
aws cloudwatch put-dashboard --region $Region --dashboard-name $DashboardName --dashboard-body $dashboardBody | Out-Null

$alarmsPath = Join-Path $PSScriptRoot '..\..\docs\observability\cloudwatch-alarms.json'
$alarms = Get-Content $alarmsPath -Raw | Replace-Placeholders | ConvertFrom-Json
foreach ($alarm in $alarms) {
  $dimensionsArgs = @()
  foreach ($dimension in $alarm.Dimensions) {
    $dimensionsArgs += "Name=$($dimension.Name),Value=$($dimension.Value)"
  }

  $command = @(
    'cloudwatch',
    'put-metric-alarm',
    '--region', $Region,
    '--alarm-name', $alarm.AlarmName,
    '--alarm-description', $alarm.AlarmDescription,
    '--namespace', $alarm.Namespace,
    '--metric-name', $alarm.MetricName,
    '--statistic', $alarm.Statistic,
    '--period', $alarm.Period,
    '--evaluation-periods', $alarm.EvaluationPeriods,
    '--datapoints-to-alarm', $alarm.DatapointsToAlarm,
    '--threshold', $alarm.Threshold,
    '--comparison-operator', $alarm.ComparisonOperator,
    '--treat-missing-data', $alarm.TreatMissingData,
    '--dimensions'
  ) + $dimensionsArgs

  if ($AlarmTopicArn) {
    $command += @('--alarm-actions', $AlarmTopicArn)
  }

  aws @command | Out-Null
}

Write-Host 'CloudWatch observability assets applied successfully.'
