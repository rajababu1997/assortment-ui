/**
 * TanStack Query key factory — structured keys for cache management.
 *
 * Pattern: each domain has an `all` key (for invalidation) and specific keys.
 * Feature modules add their own keys in Step 10.
 */

export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    user: ['auth', 'user'] as const,
    tenantConfig: ['auth', 'tenantConfig'] as const,
  },

  // ── OTB Setup (frontend-only, LocalStorage-backed) ───────────────────────
  setup: {
    all: ['setup'] as const,
    company: () => ['setup', 'company'] as const,
    timeConfig: () => ['setup', 'timeConfig'] as const,
    releaseConfig: () => ['setup', 'releaseConfig'] as const,
    progress: () => ['setup', 'progress'] as const,
    backups: () => ['setup', 'backups'] as const,
    storage: () => ['setup', 'storage'] as const,
  },

  // ── Feature module keys (added in Step 10 per module) ──────────────────
  administration: {
    users: {
      all: ['admin', 'users'] as const,
      list: () => ['admin', 'users', 'list'] as const,
    },
    roles: {
      all: ['admin', 'roles'] as const,
      list: () => ['admin', 'roles', 'list'] as const,
    },
    pluginWorkflows: {
      all: ['admin', 'pluginWorkflows'] as const,
      list: () => ['admin', 'pluginWorkflows', 'list'] as const,
      enabledInsights: () => ['admin', 'pluginWorkflows', 'enabledInsights'] as const,
    },
    notification: {
      supportedChannels: {
        all: ['admin', 'notification', 'supportedChannels'] as const,
        list: () => ['admin', 'notification', 'supportedChannels', 'list'] as const,
      },
      events: {
        all: ['admin', 'notification', 'events'] as const,
        list: () => ['admin', 'notification', 'events', 'list'] as const,
      },
      channels: {
        all: ['admin', 'notification', 'channels'] as const,
        list: () => ['admin', 'notification', 'channels', 'list'] as const,
      },
      notifiers: {
        all: ['admin', 'notification', 'notifiers'] as const,
        list: () => ['admin', 'notification', 'notifiers', 'list'] as const,
      },
      configs: {
        all: ['admin', 'notification', 'configs'] as const,
        list: () => ['admin', 'notification', 'configs', 'list'] as const,
      },
    },
    insight: {
      library: {
        all: ['admin', 'insight', 'library'] as const,
        list: () => ['admin', 'insight', 'library', 'list'] as const,
      },
    },
    cameraDiagnosis: {
      all: ['admin', 'cameraDiagnosis'] as const,
      list: () => ['admin', 'cameraDiagnosis', 'list'] as const,
    },
    healthCheck: {
      all: ['admin', 'healthCheck'] as const,
      list: () => ['admin', 'healthCheck', 'list'] as const,
    },
    categories: {
      all: ['admin', 'categories'] as const,
      list: () => ['admin', 'categories', 'list'] as const,
    },
    flightPlans: {
      all: ['admin', 'flightPlans'] as const,
      list: () => ['admin', 'flightPlans', 'list'] as const,
    },
    mhe: {
      all: ['admin', 'mhe'] as const,
      list: () => ['admin', 'mhe', 'list'] as const,
    },
    facilities: {
      all: ['admin', 'facilities'] as const,
      list: () => ['admin', 'facilities', 'list'] as const,
      detail: (uuid: string) => ['admin', 'facilities', 'detail', uuid] as const,
      cameras: (uuid: string) => ['admin', 'facilities', 'cameras', uuid] as const,
      layoutImage: (uuid: string) => ['admin', 'facilities', 'layoutImage', uuid] as const,
      cameraLayoutImage: (uuid: string) => ['admin', 'facilities', 'cameraLayoutImage', uuid] as const,
      posConfig: (uuid: string) => ['admin', 'facilities', 'posConfig', uuid] as const,
    },
    facilityEdge: {
      all: ['admin', 'facilityEdge'] as const,
      list: () => ['admin', 'facilityEdge', 'list'] as const,
    },
    persons: {
      all: ['admin', 'persons'] as const,
      list: () => ['admin', 'persons', 'list'] as const,
      detail: (uuid: string) => ['admin', 'persons', 'detail', uuid] as const,
    },
    zones: {
      all: ['admin', 'zones'] as const,
      list: () => ['admin', 'zones', 'list'] as const,
      dropdown: () => ['admin', 'zones', 'dropdown'] as const,
    },
    rbac: {
      all: ['rbac'] as const,
      roles: () => ['rbac', 'roles'] as const,
      resources: () => ['rbac', 'resources'] as const,
      rolePermissions: (roleId: string) => ['rbac', 'permissions', roleId] as const,
    },
  },
  drone: {
    all: ['drone'] as const,
    list: () => ['drone', 'list'] as const,
    planMaps: {
      all: ['drone', 'planMaps'] as const,
      list: () => ['drone', 'planMaps', 'list'] as const,
    },
    plans: {
      all: ['drone', 'plans'] as const,
      list: () => ['drone', 'plans', 'list'] as const,
    },
    insights: {
      all: ['drone', 'insights'] as const,
      list: () => ['drone', 'insights', 'list'] as const,
    },
    executions: {
      all: ['drone', 'executions'] as const,
      list: () => ['drone', 'executions', 'list'] as const,
      detail: (execUid: string) => ['drone', 'executions', 'detail', execUid] as const,
      log: (execUid: string) => ['drone', 'executions', 'log', execUid] as const,
      latestStatus: () => ['drone', 'executions', 'latestStatus'] as const,
    },
  },
  training: {
    personTraining: {
      all: ['training', 'personTraining'] as const,
      list: () => ['training', 'personTraining', 'list'] as const,
      job: (trainingUid: string) => ['training', 'personTraining', 'job', trainingUid] as const,
    },
    faceDetection: {
      all: ['training', 'faceDetection'] as const,
      list: () => ['training', 'faceDetection', 'list'] as const,
      image: (imageUid: string) => ['training', 'faceDetection', 'image', imageUid] as const,
    },
    modelTraining: {
      all: ['training', 'modelTraining'] as const,
      list: () => ['training', 'modelTraining', 'list'] as const,
      detail: (trainingUid: string) => ['training', 'modelTraining', 'detail', trainingUid] as const,
    },
  },
  mailbox: {
    all: ['mailbox'] as const,
    list: () => ['mailbox', 'list'] as const,
    detail: (uuid: string) => ['mailbox', 'detail', uuid] as const,
  },
  taskmgmt: {
    all: ['taskmgmt'] as const,
    pending: () => ['taskmgmt', 'pending'] as const,
    inprogress: () => ['taskmgmt', 'inprogress'] as const,
    completed: () => ['taskmgmt', 'completed'] as const,
    detail: (uuid: string) => ['taskmgmt', 'detail', uuid] as const,
    temperatureMonitor: (from: number, to: number) => ['taskmgmt', 'temperature', from, to] as const,
    palletMonitor: (from: number, to: number) => ['taskmgmt', 'pallet', from, to] as const,
  },
  anpr: {
    vehicle: {
      all: ['anpr', 'vehicle'] as const,
      list: (screenType?: string, filters?: unknown[]) => ['anpr', 'vehicle', 'list', screenType, filters] as const,
      detail: (uuid: string) => ['anpr', 'vehicle', 'detail', uuid] as const,
      masterData: () => ['anpr', 'vehicle', 'masterData'] as const,
      image: (uuid: string) => ['anpr', 'vehicle', 'image', uuid] as const,
      capturedImage: (trackId: string) => ['anpr', 'vehicle', 'capturedImage', trackId] as const,
      historyByLpn: (lpn: string) => ['anpr', 'vehicle', 'historyByLpn', lpn] as const,
      incidents: (lpn: string) => ['anpr', 'vehicle', 'incidents', lpn] as const,
    },
    entryExit: {
      all: ['anpr', 'entryExit'] as const,
      history: (from: string, to: string) => ['anpr', 'entryExit', 'history', from, to] as const,
      driverImage: (uid: string) => ['anpr', 'entryExit', 'driverImage', uid] as const,
      camerasByGate: (gate: string) => ['anpr', 'entryExit', 'camerasByGate', gate] as const,
      trainingJob: (jobId: string) => ['anpr', 'entryExit', 'trainingJob', jobId] as const,
      driverDetails: (uid: string) => ['anpr', 'entryExit', 'driverDetails', uid] as const,
    },
    faceRecognitionHistory: {
      all: ['anpr', 'faceRecognitionHistory'] as const,
      list: (from: number, to: number) => ['anpr', 'faceRecognitionHistory', 'list', from, to] as const,
    },
    dashboard: {
      all: ['anpr', 'dashboard'] as const,
      locations: () => ['anpr', 'dashboard', 'locations'] as const,
      locationWise: (tp: string, loc?: string, from?: number, to?: number) =>
        ['anpr', 'dashboard', 'locationWise', tp, loc, from, to] as const,
      categoryWise: (from: number, to: number) => ['anpr', 'dashboard', 'categoryWise', from, to] as const,
      typeWise: (from: number, to: number) => ['anpr', 'dashboard', 'typeWise', from, to] as const,
      makeWise: (from: number, to: number, makes: string) =>
        ['anpr', 'dashboard', 'makeWise', from, to, makes] as const,
      modelWise: (from: number, to: number, models: string) =>
        ['anpr', 'dashboard', 'modelWise', from, to, models] as const,
      makeDropdown: () => ['anpr', 'dashboard', 'makeDropdown'] as const,
      modelDropdown: () => ['anpr', 'dashboard', 'modelDropdown'] as const,
    },
    violationDashboard: {
      all: ['anpr', 'violationDashboard'] as const,
      locations: () => ['anpr', 'violationDashboard', 'locations'] as const,
      unitDropdown: () => ['anpr', 'violationDashboard', 'unitDropdown'] as const,
      categoryDropdown: () => ['anpr', 'violationDashboard', 'categoryDropdown'] as const,
      violationByVehicle: (tp: string, loc?: string, lpr?: string, uname?: string, cat?: string) =>
        ['anpr', 'violationDashboard', 'byVehicle', tp, loc, lpr, uname, cat] as const,
    },
  },
  mediaLibrary: {
    all: ['mediaLibrary'] as const,
    list: () => ['mediaLibrary', 'list'] as const,
    facilities: () => ['mediaLibrary', 'facilities'] as const,
    cameras: () => ['mediaLibrary', 'cameras'] as const,
  },
  notificationBell: {
    all: ['notificationBell'] as const,
    latest: () => ['notificationBell', 'latest'] as const,
  },
  notificationHistory: {
    all: ['notificationHistory'] as const,
    list: (from: number, to: number) => ['notificationHistory', 'list', from, to] as const,
  },
  home: {
    all: ['home'] as const,
    kpiSummary: () => ['home', 'kpiSummary'] as const,
    summary: () => ['home', 'summary'] as const,
  },
  prism: {
    all: ['prism'] as const,
    frames: () => ['prism', 'frames'] as const,
  },
  incidentDashboard: {
    all: ['incidentDashboard'] as const,
    locationSummary: () => ['incidentDashboard', 'locationSummary'] as const,
    departmentSummary: () => ['incidentDashboard', 'departmentSummary'] as const,
    deptDaywise: () => ['incidentDashboard', 'deptDaywise'] as const,
  },
  vehicleSummary: {
    all: ['vehicleSummary'] as const,
    kpiIn: () => ['vehicleSummary', 'kpiIn'] as const,
    kpiOut: () => ['vehicleSummary', 'kpiOut'] as const,
    inTrend: (tp: string, from?: number, to?: number) => ['vehicleSummary', 'inTrend', tp, from, to] as const,
    outTrend: (tp: string, from?: number, to?: number) => ['vehicleSummary', 'outTrend', tp, from, to] as const,
    locationWise: (tp: string, loc?: string, from?: number, to?: number) =>
      ['vehicleSummary', 'locationWise', tp, loc, from, to] as const,
    typeWise: (from?: number, to?: number) => ['vehicleSummary', 'typeWise', from, to] as const,
    locations: () => ['vehicleSummary', 'locations'] as const,
  },
  sosDashboard: {
    all: ['sosDashboard'] as const,
    locations: () => ['sosDashboard', 'locations'] as const,
    kpi: {
      daysSinceLastViolation: () => ['sosDashboard', 'kpi', 'daysSinceLastViolation'] as const,
      openIncidents: () => ['sosDashboard', 'kpi', 'openIncidents'] as const,
      openIncidentsByType: () => ['sosDashboard', 'kpi', 'openIncidentsByType'] as const,
      closedWithinTAT: () => ['sosDashboard', 'kpi', 'closedWithinTAT'] as const,
      closedBeyondTAT: () => ['sosDashboard', 'kpi', 'closedBeyondTAT'] as const,
      daysSinceLastFire: () => ['sosDashboard', 'kpi', 'daysSinceLastFire'] as const,
      palletsFirstAttempt: () => ['sosDashboard', 'kpi', 'palletsFirstAttempt'] as const,
      palletsMultipleAttempt: () => ['sosDashboard', 'kpi', 'palletsMultipleAttempt'] as const,
      maxMinPalletTime: () => ['sosDashboard', 'kpi', 'maxMinPalletTime'] as const,
      avgResolutionTime: () => ['sosDashboard', 'kpi', 'avgResolutionTime'] as const,
    },
    incidents: {
      bySeverity: (from: number, to: number) => ['sosDashboard', 'incidents', 'bySeverity', from, to] as const,
      byLocation: (from: number, to: number, loc?: string) =>
        ['sosDashboard', 'incidents', 'byLocation', from, to, loc] as const,
      byLocationTime: (from: number, to: number, loc?: string) =>
        ['sosDashboard', 'incidents', 'byLocationTime', from, to, loc] as const,
      byType: (from: number, to: number) => ['sosDashboard', 'incidents', 'byType', from, to] as const,
    },
    pallets: {
      byDay: (from: number, to: number) => ['sosDashboard', 'pallets', 'byDay', from, to] as const,
      firstAttempt: (from: number, to: number) => ['sosDashboard', 'pallets', 'firstAttempt', from, to] as const,
      avgTime: (from: number, to: number) => ['sosDashboard', 'pallets', 'avgTime', from, to] as const,
      productivityVNA: (from: number, to: number) => ['sosDashboard', 'pallets', 'productivityVNA', from, to] as const,
    },
    tat: {
      dayWiseClosed: (from: number, to: number) => ['sosDashboard', 'tat', 'dayWiseClosed', from, to] as const,
      closedByMonth: (year: number) => ['sosDashboard', 'tat', 'closedByMonth', year] as const,
      openByCategory: (from: number, to: number) => ['sosDashboard', 'tat', 'openByCategory', from, to] as const,
      closedByCategory: (from: number, to: number) => ['sosDashboard', 'tat', 'closedByCategory', from, to] as const,
      closedByLocation: (from: number, to: number) => ['sosDashboard', 'tat', 'closedByLocation', from, to] as const,
      medianAging: () => ['sosDashboard', 'tat', 'medianAging'] as const,
      beyondTATByMonth: () => ['sosDashboard', 'tat', 'beyondTATByMonth'] as const,
      beyondTATByCategory: () => ['sosDashboard', 'tat', 'beyondTATByCategory'] as const,
    },
  },

  // ── Monitor ──────────────────────────────────────────────────────────────
  monitor: {
    threats: {
      all: ['monitor', 'threats'] as const,
      list: () => ['monitor', 'threats', 'list'] as const,
      detail: (uuid: string) => ['monitor', 'threats', 'detail', uuid] as const,
      history: (uuid: string) => ['monitor', 'threats', 'history', uuid] as const,
      image: (uuid: string) => ['monitor', 'threats', 'image', uuid] as const,
    },
    vehicleDetails: {
      all: ['monitor', 'vehicleDetails'] as const,
      detail: (uuid: string) => ['monitor', 'vehicleDetails', 'detail', uuid] as const,
    },
    cameras: {
      all: ['monitor', 'cameras'] as const,
      list: () => ['monitor', 'cameras', 'list'] as const,
    },
    facilities: {
      all: ['monitor', 'facilities'] as const,
      list: () => ['monitor', 'facilities', 'list'] as const,
      zones: (facilityUid: string) => ['monitor', 'facilities', 'zones', facilityUid] as const,
      layout: (facilityUid: string) => ['monitor', 'facilities', 'layout', facilityUid] as const,
    },
  },
} as const;
