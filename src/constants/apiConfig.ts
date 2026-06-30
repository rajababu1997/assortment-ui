import type { ApiEndpoint } from './apiConfig.types';

/**
 * API endpoint catalogue.
 *
 * To add a new endpoint:
 *   1. Add a typed entry below.
 *   2. Use `invokeService(API_CONFIG.section.name, { params }, payload)` in features.
 */
export const API_CONFIG = {
  auth: {
    login:    { url: 'user',    type: 'POST' } as ApiEndpoint,
    logout:   { url: 'auth/logout',   type: 'POST' } as ApiEndpoint,
    refresh:  { url: 'auth/refresh',  type: 'POST' } as ApiEndpoint,
    forgot:   { url: 'auth/forgot',   type: 'POST' } as ApiEndpoint,
    reset:    { url: 'auth/reset',    type: 'POST' } as ApiEndpoint,
    me:       { url: 'auth/me',       type: 'GET'  } as ApiEndpoint,
  },
  profile: {
    get:      { url: 'profile',       type: 'GET'  } as ApiEndpoint,
    update:   { url: 'profile',       type: 'PUT'  } as ApiEndpoint,
    changePassword: { url: 'profile/password', type: 'PUT' } as ApiEndpoint,
  },
  sample: {
    list:     { url: 'sample',                type: 'GET'    } as ApiEndpoint,
    get:      { url: 'sample/{uuid}',         type: 'GET',    paramList: ['uuid'] } as ApiEndpoint,
    create:   { url: 'sample',                type: 'POST'   } as ApiEndpoint,
    update:   { url: 'sample/{uuid}',         type: 'PUT',    paramList: ['uuid'] } as ApiEndpoint,
    delete:   { url: 'sample/{uuid}',         type: 'DELETE', paramList: ['uuid'] } as ApiEndpoint,
  },
  otb: {
    brandAll:        { url: 'otb/brand/all',                   type: 'GET' } as ApiEndpoint,
    brandByUid:      { url: 'otb/brand/{uuid}',                type: 'GET', paramList: ['uuid'] } as ApiEndpoint,
    categoryAll:     { url: 'otb/category/all',                type: 'GET' } as ApiEndpoint,
    categoryByBrand: { url: 'otb/category/brand/{brandUuid}',  type: 'GET', paramList: ['brandUuid'] } as ApiEndpoint,
    categoryByUid:   { url: 'otb/category/{uuid}',             type: 'GET', paramList: ['uuid'] } as ApiEndpoint,
    planAll:         { url: 'otb/plan/all',                    type: 'GET'    } as ApiEndpoint,
    planByUid:       { url: 'otb/plan/{uuid}',                 type: 'GET',    paramList: ['uuid'] } as ApiEndpoint,
    planCreate:      { url: 'otb/plan',                        type: 'POST'   } as ApiEndpoint,
    planUpdate:      { url: 'otb/plan/{uuid}',                 type: 'PUT',    paramList: ['uuid'] } as ApiEndpoint,
    planDelete:      { url: 'otb/plan/{uuid}',                 type: 'DELETE', paramList: ['uuid'] } as ApiEndpoint,
    periodLock:      { url: 'otb/plan/{planId}/period/{periodKey}/lock', type: 'POST', paramList: ['planId', 'periodKey'] } as ApiEndpoint,
    periodSkip:      { url: 'otb/plan/{planId}/period/{periodKey}/skip', type: 'POST', paramList: ['planId', 'periodKey'] } as ApiEndpoint,
    valueAll:        { url: 'otb/value/all',                                  type: 'GET'    } as ApiEndpoint,
    valueAllRange:   { url: 'otb/value/all/{from}/{to}',                      type: 'GET',    paramList: ['from', 'to'] } as ApiEndpoint,
    valueByPlan:     { url: 'otb/value/{planId}/rows',                        type: 'GET',    paramList: ['planId'] } as ApiEndpoint,
    valueByOtbCode:  { url: 'otb/value/{planId}/{otbCode}',                   type: 'GET',    paramList: ['planId', 'otbCode'] } as ApiEndpoint,
    valueSave:       { url: 'otb/value/{planId}/{otbCode}',                   type: 'POST',   paramList: ['planId', 'otbCode'] } as ApiEndpoint,
    valueDelete:     { url: 'otb/value/{planId}/{otbCode}',                   type: 'DELETE', paramList: ['planId', 'otbCode'] } as ApiEndpoint,
    optionAll:       { url: 'otb/option/all',                                 type: 'GET'    } as ApiEndpoint,
    optionAllRange:  { url: 'otb/option/all/{from}/{to}',                     type: 'GET',    paramList: ['from', 'to'] } as ApiEndpoint,
    optionByPlan:    { url: 'otb/option/{planId}/rows',                       type: 'GET',    paramList: ['planId'] } as ApiEndpoint,
    optionByOtbCode: { url: 'otb/option/{planId}/{otbCode}',                  type: 'GET',    paramList: ['planId', 'otbCode'] } as ApiEndpoint,
    optionSave:      { url: 'otb/option/{planId}/{otbCode}',                  type: 'POST',   paramList: ['planId', 'otbCode'] } as ApiEndpoint,
    optionDelete:    { url: 'otb/option/{planId}/{otbCode}',                  type: 'DELETE', paramList: ['planId', 'otbCode'] } as ApiEndpoint,
    optionAddNote:   { url: 'otb/option/{planId}/{otbCode}/comments',         type: 'POST',   paramList: ['planId', 'otbCode'] } as ApiEndpoint,
    optionMonthReady:{ url: 'otb/option/{planId}/month-ready/{periodKey}',    type: 'GET',    paramList: ['planId', 'periodKey'] } as ApiEndpoint,
    lifecycleAll:        { url: 'otb/lifecycle/rows/all',                          type: 'GET' } as ApiEndpoint,
    lifecycleAllRange:   { url: 'otb/lifecycle/rows/all/{from}/{to}',              type: 'GET',  paramList: ['from', 'to'] } as ApiEndpoint,
    lifecycleDetail:     { url: 'otb/lifecycle/{planId}/{otbCode}/detail',         type: 'GET',  paramList: ['planId', 'otbCode'] } as ApiEndpoint,
    lifecycleTimeline:   { url: 'otb/lifecycle/{planId}/{otbCode}/timeline',       type: 'GET',  paramList: ['planId', 'otbCode'] } as ApiEndpoint,
    lifecycleFinalApprove: { url: 'otb/lifecycle/{planId}/{otbCode}/final-approve', type: 'POST', paramList: ['planId', 'otbCode'] } as ApiEndpoint,
  },
} as const;
