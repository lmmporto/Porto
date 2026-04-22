# INDEX

## Navegação principal

- [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md)
- [FLOW_SUMMARY.md](FLOW_SUMMARY.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [MANIFEST.json](MANIFEST.json)

## 01-FUNDAMENTAL

### backend

- [api-server/src/app.ts](01-FUNDAMENTAL/backend/api-server_src_app.ts.md) — bootstrap, criticidade critical, score 150
- [api-server/src/index.ts](01-FUNDAMENTAL/backend/api-server_src_index.ts.md) — bootstrap, criticidade critical, score 150
- [api-server/src/routes/calls.ts](01-FUNDAMENTAL/backend/api-server_src_routes_calls.ts.md) — route, criticidade critical, score 150
- [api-server/src/routes/health.ts](01-FUNDAMENTAL/backend/api-server_src_routes_health.ts.md) — route, criticidade critical, score 150
- [api-server/src/routes/sdr-registro.ts](01-FUNDAMENTAL/backend/api-server_src_routes_sdr-registro.ts.md) — route, criticidade critical, score 150
- [api-server/src/routes/stats.ts](01-FUNDAMENTAL/backend/api-server_src_routes_stats.ts.md) — route, criticidade critical, score 150
- [api-server/src/services/analysis.service.ts](01-FUNDAMENTAL/backend/api-server_src_services_analysis.service.ts.md) — service, criticidade critical, score 148
- [api-server/src/services/coaching.service.ts](01-FUNDAMENTAL/backend/api-server_src_services_coaching.service.ts.md) — service, criticidade critical, score 148
- [api-server/src/services/hubspot.ts](01-FUNDAMENTAL/backend/api-server_src_services_hubspot.ts.md) — service, criticidade critical, score 148
- [api-server/src/services/metrics.service.ts](01-FUNDAMENTAL/backend/api-server_src_services_metrics.service.ts.md) — service, criticidade critical, score 148
- [api-server/src/services/processCall.ts](01-FUNDAMENTAL/backend/api-server_src_services_processCall.ts.md) — service, criticidade critical, score 148
- [api-server/src/services/recupera_ouro.ts](01-FUNDAMENTAL/backend/api-server_src_services_recupera_ouro.ts.md) — service, criticidade critical, score 148
- [api-server/src/services/refreshPendingAudioCall.ts](01-FUNDAMENTAL/backend/api-server_src_services_refreshPendingAudioCall.ts.md) — service, criticidade critical, score 148
- [api-server/src/services/webhook.service.ts](01-FUNDAMENTAL/backend/api-server_src_services_webhook.service.ts.md) — service, criticidade critical, score 148
- [api-server/src/services/worker.service.ts](01-FUNDAMENTAL/backend/api-server_src_services_worker.service.ts.md) — service, criticidade critical, score 148
- [api-server/src/config.ts](01-FUNDAMENTAL/backend/api-server_src_config.ts.md) — config, criticidade critical, score 145
- [api-server/src/clients.ts](01-FUNDAMENTAL/backend/api-server_src_clients.ts.md) — client-config, criticidade critical, score 130
- [api-server/src/middleware/requireAdmin.ts](01-FUNDAMENTAL/backend/api-server_src_middleware_requireAdmin.ts.md) — middleware, criticidade critical, score 130
- [api-server/INSTRUCTIONS.MD](01-FUNDAMENTAL/backend/api-server_INSTRUCTIONS.MD.md) — documentation, criticidade important, score 118
- [api-server/package.json](01-FUNDAMENTAL/backend/api-server_package.json.md) — package-config, criticidade important, score 118
- [api-server/tsconfig.json](01-FUNDAMENTAL/backend/api-server_tsconfig.json.md) — typescript-config, criticidade important, score 118
- [api-server/src/types/analysis.ts](01-FUNDAMENTAL/backend/api-server_src_types_analysis.ts.md) — type-definition, criticidade important, score 118
- [api-server/src/constants/hubspot.ts](01-FUNDAMENTAL/backend/api-server_src_constants_hubspot.ts.md) — constant, criticidade important, score 118
- [api-server/src/build.ts](01-FUNDAMENTAL/backend/api-server_src_build.ts.md) — source-file, criticidade supporting, score 110

### frontend

- [frontend/src/features/dashboard/api/dashboard.service.ts](01-FUNDAMENTAL/frontend/frontend_src_features_dashboard_api_dashboard.service.ts.md) — feature-api, criticidade important, score 124
- [frontend/src/features/calls/api/calls.service.ts](01-FUNDAMENTAL/frontend/frontend_src_features_calls_api_calls.service.ts.md) — feature-api, criticidade important, score 124
- [frontend/src/hooks/use-mobile.tsx](01-FUNDAMENTAL/frontend/frontend_src_hooks_use-mobile.tsx.md) — hook, criticidade important, score 108
- [frontend/src/hooks/use-toast.ts](01-FUNDAMENTAL/frontend/frontend_src_hooks_use-toast.ts.md) — hook, criticidade important, score 108
- [frontend/src/hooks/useCallsEngine.ts](01-FUNDAMENTAL/frontend/frontend_src_hooks_useCallsEngine.ts.md) — hook, criticidade important, score 108
- [frontend/src/hooks/useSDRDashboardSync.ts](01-FUNDAMENTAL/frontend/frontend_src_hooks_useSDRDashboardSync.ts.md) — hook, criticidade important, score 108
- [frontend/src/features/sdrs/components/sdr-insights-summary.tsx](01-FUNDAMENTAL/frontend/frontend_src_features_sdrs_components_sdr-insights-summary.tsx.md) — feature-component, criticidade important, score 108
- [frontend/src/features/sdrs/components/sdr-stats-cards.tsx](01-FUNDAMENTAL/frontend/frontend_src_features_sdrs_components_sdr-stats-cards.tsx.md) — feature-component, criticidade important, score 108
- [frontend/src/features/insights/components/ai-recommendations.tsx](01-FUNDAMENTAL/frontend/frontend_src_features_insights_components_ai-recommendations.tsx.md) — feature-component, criticidade important, score 108
- [frontend/src/features/insights/components/trend-indicators.tsx](01-FUNDAMENTAL/frontend/frontend_src_features_insights_components_trend-indicators.tsx.md) — feature-component, criticidade important, score 108
- [frontend/src/features/gaps/components/gap-analysis-header.tsx](01-FUNDAMENTAL/frontend/frontend_src_features_gaps_components_gap-analysis-header.tsx.md) — feature-component, criticidade important, score 108
- [frontend/src/features/gaps/components/sdr-impact-list.tsx](01-FUNDAMENTAL/frontend/frontend_src_features_gaps_components_sdr-impact-list.tsx.md) — feature-component, criticidade important, score 108
- [frontend/src/features/evolution/components/evolution-chart.tsx](01-FUNDAMENTAL/frontend/frontend_src_features_evolution_components_evolution-chart.tsx.md) — feature-component, criticidade important, score 108
- [frontend/src/features/evolution/components/evolution-table.tsx](01-FUNDAMENTAL/frontend/frontend_src_features_evolution_components_evolution-table.tsx.md) — feature-component, criticidade important, score 108
- [frontend/src/features/dashboard/components/ConsolidatedReading.tsx](01-FUNDAMENTAL/frontend/frontend_src_features_dashboard_components_ConsolidatedReading.tsx.md) — feature-component, criticidade important, score 108
- [frontend/src/features/dashboard/components/FilterBar.tsx](01-FUNDAMENTAL/frontend/frontend_src_features_dashboard_components_FilterBar.tsx.md) — feature-component, criticidade important, score 108
- [frontend/src/features/dashboard/components/global-gap-analysis.tsx](01-FUNDAMENTAL/frontend/frontend_src_features_dashboard_components_global-gap-analysis.tsx.md) — feature-component, criticidade important, score 108
- [frontend/src/features/dashboard/components/HealthRadar.tsx](01-FUNDAMENTAL/frontend/frontend_src_features_dashboard_components_HealthRadar.tsx.md) — feature-component, criticidade important, score 108
- [frontend/src/features/dashboard/components/sdr-leaderboard.tsx](01-FUNDAMENTAL/frontend/frontend_src_features_dashboard_components_sdr-leaderboard.tsx.md) — feature-component, criticidade important, score 108
- [frontend/src/features/dashboard/components/SdrProfilePanel.tsx](01-FUNDAMENTAL/frontend/frontend_src_features_dashboard_components_SdrProfilePanel.tsx.md) — feature-component, criticidade important, score 108
- [frontend/src/features/dashboard/components/team-stats-grid.tsx](01-FUNDAMENTAL/frontend/frontend_src_features_dashboard_components_team-stats-grid.tsx.md) — feature-component, criticidade important, score 108
- [frontend/src/features/dashboard/components/TeamStats.tsx](01-FUNDAMENTAL/frontend/frontend_src_features_dashboard_components_TeamStats.tsx.md) — feature-component, criticidade important, score 108
- [frontend/src/features/dashboard/components/TopObjections.tsx](01-FUNDAMENTAL/frontend/frontend_src_features_dashboard_components_TopObjections.tsx.md) — feature-component, criticidade important, score 108
- [frontend/src/features/dashboard/components/TopPerformance.tsx](01-FUNDAMENTAL/frontend/frontend_src_features_dashboard_components_TopPerformance.tsx.md) — feature-component, criticidade important, score 108
- [frontend/src/features/coaching/components/coaching-priority-list.tsx](01-FUNDAMENTAL/frontend/frontend_src_features_coaching_components_coaching-priority-list.tsx.md) — feature-component, criticidade important, score 108
- [frontend/src/features/calls/components/analysis-insights.tsx](01-FUNDAMENTAL/frontend/frontend_src_features_calls_components_analysis-insights.tsx.md) — feature-component, criticidade important, score 108
- [frontend/src/features/calls/components/call-header.tsx](01-FUNDAMENTAL/frontend/frontend_src_features_calls_components_call-header.tsx.md) — feature-component, criticidade important, score 108
- [frontend/src/features/calls/components/CallAnalysis.tsx](01-FUNDAMENTAL/frontend/frontend_src_features_calls_components_CallAnalysis.tsx.md) — feature-component, criticidade important, score 108
- [frontend/src/features/calls/components/CallFilters.tsx](01-FUNDAMENTAL/frontend/frontend_src_features_calls_components_CallFilters.tsx.md) — feature-component, criticidade important, score 108
- [frontend/src/features/calls/components/CallInsights.tsx](01-FUNDAMENTAL/frontend/frontend_src_features_calls_components_CallInsights.tsx.md) — feature-component, criticidade important, score 108
- [frontend/src/features/calls/components/CallList.tsx](01-FUNDAMENTAL/frontend/frontend_src_features_calls_components_CallList.tsx.md) — feature-component, criticidade important, score 108
- [frontend/src/features/calls/components/calls-table.tsx](01-FUNDAMENTAL/frontend/frontend_src_features_calls_components_calls-table.tsx.md) — feature-component, criticidade important, score 108
- [frontend/src/features/calls/components/coaching-timeline.tsx](01-FUNDAMENTAL/frontend/frontend_src_features_calls_components_coaching-timeline.tsx.md) — feature-component, criticidade important, score 108
- [frontend/src/features/calls/components/listening-stats.tsx](01-FUNDAMENTAL/frontend/frontend_src_features_calls_components_listening-stats.tsx.md) — feature-component, criticidade important, score 108
- [frontend/src/context/CallContext.tsx](01-FUNDAMENTAL/frontend/frontend_src_context_CallContext.tsx.md) — context, criticidade important, score 108
- [frontend/src/context/DashboardContext.tsx](01-FUNDAMENTAL/frontend/frontend_src_context_DashboardContext.tsx.md) — context, criticidade important, score 108
- [frontend/src/features/sdrs/mocks/sdr-profile.mock.ts](01-FUNDAMENTAL/frontend/frontend_src_features_sdrs_mocks_sdr-profile.mock.ts.md) — source-file, criticidade supporting, score 100
- [frontend/src/features/insights/mocks/ai-insights.mock.ts](01-FUNDAMENTAL/frontend/frontend_src_features_insights_mocks_ai-insights.mock.ts.md) — source-file, criticidade supporting, score 100
- [frontend/src/features/gaps/mocks/gap-detail.mock.ts](01-FUNDAMENTAL/frontend/frontend_src_features_gaps_mocks_gap-detail.mock.ts.md) — source-file, criticidade supporting, score 100
- [frontend/src/features/evolution/mocks/evolution-data.mock.ts](01-FUNDAMENTAL/frontend/frontend_src_features_evolution_mocks_evolution-data.mock.ts.md) — source-file, criticidade supporting, score 100
- [frontend/src/features/dashboard/mocks/team-data.mock.ts](01-FUNDAMENTAL/frontend/frontend_src_features_dashboard_mocks_team-data.mock.ts.md) — source-file, criticidade supporting, score 100
- [frontend/src/features/coaching/mocks/coaching-queue.mock.ts](01-FUNDAMENTAL/frontend/frontend_src_features_coaching_mocks_coaching-queue.mock.ts.md) — source-file, criticidade supporting, score 100
- [frontend/src/features/calls/mocks/call-detail.mock.ts](01-FUNDAMENTAL/frontend/frontend_src_features_calls_mocks_call-detail.mock.ts.md) — source-file, criticidade supporting, score 100
- [frontend/src/features/calls/mocks/calls-list.mock.ts](01-FUNDAMENTAL/frontend/frontend_src_features_calls_mocks_calls-list.mock.ts.md) — source-file, criticidade supporting, score 100
- [frontend/src/features/calls/mocks/calls.ts](01-FUNDAMENTAL/frontend/frontend_src_features_calls_mocks_calls.ts.md) — source-file, criticidade supporting, score 100

### ai

- [frontend/src/ai/flows/extract-key-points.ts](01-FUNDAMENTAL/ai/frontend_src_ai_flows_extract-key-points.ts.md) — ai-flow, criticidade critical, score 152
- [frontend/src/ai/flows/summarize-call.ts](01-FUNDAMENTAL/ai/frontend_src_ai_flows_summarize-call.ts.md) — ai-flow, criticidade critical, score 152
- [frontend/src/ai/flows/transcribe-call.ts](01-FUNDAMENTAL/ai/frontend_src_ai_flows_transcribe-call.ts.md) — ai-flow, criticidade critical, score 152

### shared

- [frontend/package.json](01-FUNDAMENTAL/shared/frontend_package.json.md) — package-config, criticidade important, score 108
- [frontend/README.md](01-FUNDAMENTAL/shared/frontend_README.md.md) — documentation, criticidade important, score 108
- [frontend/tsconfig.json](01-FUNDAMENTAL/shared/frontend_tsconfig.json.md) — typescript-config, criticidade important, score 108
- [frontend/src/types/call.ts](01-FUNDAMENTAL/shared/frontend_src_types_call.ts.md) — type-definition, criticidade important, score 108
- [frontend/src/types/index.ts](01-FUNDAMENTAL/shared/frontend_src_types_index.ts.md) — type-definition, criticidade important, score 108

## 02-HIGH-VALUE

### backend

- [api-server/src/utils/auth.ts](02-HIGH-VALUE/backend/api-server_src_utils_auth.ts.md) — utility, criticidade important, score 88
- [api-server/src/utils/hubspot-parser.ts](02-HIGH-VALUE/backend/api-server_src_utils_hubspot-parser.ts.md) — utility, criticidade important, score 88

### frontend

- [frontend/src/app/page.tsx](02-HIGH-VALUE/frontend/frontend_src_app_page.tsx.md) — page, criticidade important, score 90
- [frontend/src/app/me/page.tsx](02-HIGH-VALUE/frontend/frontend_src_app_me_page.tsx.md) — page, criticidade important, score 90
- [frontend/src/app/login/page.tsx](02-HIGH-VALUE/frontend/frontend_src_app_login_page.tsx.md) — page, criticidade important, score 90
- [frontend/src/app/dashboard/page.tsx](02-HIGH-VALUE/frontend/frontend_src_app_dashboard_page.tsx.md) — page, criticidade important, score 90
- [frontend/src/app/dashboard/upload/page.tsx](02-HIGH-VALUE/frontend/frontend_src_app_dashboard_upload_page.tsx.md) — page, criticidade important, score 90
- [frontend/src/app/dashboard/teams/page.tsx](02-HIGH-VALUE/frontend/frontend_src_app_dashboard_teams_page.tsx.md) — page, criticidade important, score 90
- [frontend/src/app/dashboard/team/page.tsx](02-HIGH-VALUE/frontend/frontend_src_app_dashboard_team_page.tsx.md) — page, criticidade important, score 90
- [frontend/src/app/dashboard/sdrs/page.tsx](02-HIGH-VALUE/frontend/frontend_src_app_dashboard_sdrs_page.tsx.md) — page, criticidade important, score 90
- [frontend/src/app/dashboard/sdrs/[id]/page.tsx](02-HIGH-VALUE/frontend/frontend_src_app_dashboard_sdrs_[id]_page.tsx.md) — page, criticidade important, score 90
- [frontend/src/app/dashboard/ranking/page.tsx](02-HIGH-VALUE/frontend/frontend_src_app_dashboard_ranking_page.tsx.md) — page, criticidade important, score 90
- [frontend/src/app/dashboard/me/page.tsx](02-HIGH-VALUE/frontend/frontend_src_app_dashboard_me_page.tsx.md) — page, criticidade important, score 90
- [frontend/src/app/dashboard/insights/page.tsx](02-HIGH-VALUE/frontend/frontend_src_app_dashboard_insights_page.tsx.md) — page, criticidade important, score 90
- [frontend/src/app/dashboard/gaps/[id]/page.tsx](02-HIGH-VALUE/frontend/frontend_src_app_dashboard_gaps_[id]_page.tsx.md) — page, criticidade important, score 90
- [frontend/src/app/dashboard/evolution/page.tsx](02-HIGH-VALUE/frontend/frontend_src_app_dashboard_evolution_page.tsx.md) — page, criticidade important, score 90
- [frontend/src/app/dashboard/coaching/page.tsx](02-HIGH-VALUE/frontend/frontend_src_app_dashboard_coaching_page.tsx.md) — page, criticidade important, score 90
- [frontend/src/app/dashboard/calls/page.tsx](02-HIGH-VALUE/frontend/frontend_src_app_dashboard_calls_page.tsx.md) — page, criticidade important, score 90
- [frontend/src/app/dashboard/calls/[id]/page.tsx](02-HIGH-VALUE/frontend/frontend_src_app_dashboard_calls_[id]_page.tsx.md) — page, criticidade important, score 90
- [frontend/src/app/(dashboard)/calls/page.tsx](02-HIGH-VALUE/frontend/frontend_src_app_(dashboard)_calls_page.tsx.md) — page, criticidade important, score 90
- [frontend/src/app/(dashboard)/calls/[id]/page.tsx](02-HIGH-VALUE/frontend/frontend_src_app_(dashboard)_calls_[id]_page.tsx.md) — page, criticidade important, score 90
- [frontend/src/components/layout/header.tsx](02-HIGH-VALUE/frontend/frontend_src_components_layout_header.tsx.md) — component, criticidade important, score 78
- [frontend/src/components/layout/sidebar.tsx](02-HIGH-VALUE/frontend/frontend_src_components_layout_sidebar.tsx.md) — component, criticidade important, score 78
- [frontend/src/components/dashboard/CallCard.tsx](02-HIGH-VALUE/frontend/frontend_src_components_dashboard_CallCard.tsx.md) — component, criticidade important, score 78
- [frontend/src/components/dashboard/ManualTriggerCard.tsx](02-HIGH-VALUE/frontend/frontend_src_components_dashboard_ManualTriggerCard.tsx.md) — component, criticidade important, score 78
- [frontend/src/components/dashboard/SDRCard.tsx](02-HIGH-VALUE/frontend/frontend_src_components_dashboard_SDRCard.tsx.md) — component, criticidade important, score 78
- [frontend/src/components/dashboard/SDRRanking.tsx](02-HIGH-VALUE/frontend/frontend_src_components_dashboard_SDRRanking.tsx.md) — component, criticidade important, score 78
- [frontend/src/components/dashboard/SidebarNav.tsx](02-HIGH-VALUE/frontend/frontend_src_components_dashboard_SidebarNav.tsx.md) — component, criticidade important, score 78
- [frontend/src/components/dashboard/TeamCard.tsx](02-HIGH-VALUE/frontend/frontend_src_components_dashboard_TeamCard.tsx.md) — component, criticidade important, score 78
- [frontend/src/app/layout.tsx](02-HIGH-VALUE/frontend/frontend_src_app_layout.tsx.md) — layout, criticidade important, score 78
- [frontend/src/app/dashboard/layout.tsx](02-HIGH-VALUE/frontend/frontend_src_app_dashboard_layout.tsx.md) — layout, criticidade important, score 78
- [frontend/src/app/lib/placeholder-images.json](02-HIGH-VALUE/frontend/frontend_src_app_lib_placeholder-images.json.md) — source-file, criticidade supporting, score 70

### ai

_Nenhum arquivo_

### shared

- [frontend/src/lib/groupers.ts](02-HIGH-VALUE/shared/frontend_src_lib_groupers.ts.md) — source-file, criticidade supporting, score 70
- [frontend/src/lib/metrics.ts](02-HIGH-VALUE/shared/frontend_src_lib_metrics.ts.md) — source-file, criticidade supporting, score 70
- [frontend/src/lib/mock-call.ts](02-HIGH-VALUE/shared/frontend_src_lib_mock-call.ts.md) — source-file, criticidade supporting, score 70
- [frontend/src/lib/placeholder-images.json](02-HIGH-VALUE/shared/frontend_src_lib_placeholder-images.json.md) — source-file, criticidade supporting, score 70
- [frontend/src/lib/placeholder-images.ts](02-HIGH-VALUE/shared/frontend_src_lib_placeholder-images.ts.md) — source-file, criticidade supporting, score 70
- [frontend/src/lib/utils.ts](02-HIGH-VALUE/shared/frontend_src_lib_utils.ts.md) — source-file, criticidade supporting, score 70

## 03-SUPPORTING

### backend

- [api-server/avaliacao.ts](03-SUPPORTING/backend/api-server_avaliacao.ts.md) — source-file, criticidade supporting, score 50
- [api-server/limpeza.js](03-SUPPORTING/backend/api-server_limpeza.js.md) — source-file, criticidade supporting, score 50
- [api-server/salvastats.ts](03-SUPPORTING/backend/api-server_salvastats.ts.md) — source-file, criticidade supporting, score 50
- [api-server/scriptgenerico.js](03-SUPPORTING/backend/api-server_scriptgenerico.js.md) — source-file, criticidade supporting, score 50
- [api-server/src/types.d.ts](03-SUPPORTING/backend/api-server_src_types.d.ts.md) — source-file, criticidade supporting, score 50
- [api-server/src/types.ts](03-SUPPORTING/backend/api-server_src_types.ts.md) — source-file, criticidade supporting, score 50
- [api-server/src/utils.ts](03-SUPPORTING/backend/api-server_src_utils.ts.md) — source-file, criticidade supporting, score 50

### frontend

- [frontend/src/components/theme-provider.tsx](03-SUPPORTING/frontend/frontend_src_components_theme-provider.tsx.md) — component, criticidade important, score 48

### ai

- [frontend/src/ai/dev.ts](03-SUPPORTING/ai/frontend_src_ai_dev.ts.md) — source-file, criticidade supporting, score 52
- [frontend/src/ai/genkit.ts](03-SUPPORTING/ai/frontend_src_ai_genkit.ts.md) — source-file, criticidade supporting, score 52

### shared

- [CHANGELOG.md](03-SUPPORTING/shared/CHANGELOG.md.md) — source-file, criticidade supporting, score 40
- [notebook.js](03-SUPPORTING/shared/notebook.js.md) — source-file, criticidade supporting, score 40
- [notebooklm-export.config.json](03-SUPPORTING/shared/notebooklm-export.config.json.md) — source-file, criticidade supporting, score 40
- [frontend/components.json](03-SUPPORTING/shared/frontend_components.json.md) — source-file, criticidade supporting, score 40
- [frontend/next-env.d.ts](03-SUPPORTING/shared/frontend_next-env.d.ts.md) — source-file, criticidade supporting, score 40
- [frontend/next.config.ts](03-SUPPORTING/shared/frontend_next.config.ts.md) — source-file, criticidade supporting, score 40
- [frontend/postcss.config.mjs](03-SUPPORTING/shared/frontend_postcss.config.mjs.md) — source-file, criticidade supporting, score 40
- [frontend/tailwind.config.ts](03-SUPPORTING/shared/frontend_tailwind.config.ts.md) — source-file, criticidade supporting, score 40
- [frontend/docs/architecture.md](03-SUPPORTING/shared/frontend_docs_architecture.md.md) — source-file, criticidade supporting, score 40
- [frontend/docs/blueprint.md](03-SUPPORTING/shared/frontend_docs_blueprint.md.md) — source-file, criticidade supporting, score 40
- [ai-context/agent_prompt.md](03-SUPPORTING/shared/ai-context_agent_prompt.md.md) — source-file, criticidade supporting, score 40
- [ai-context/architecture.md](03-SUPPORTING/shared/ai-context_architecture.md.md) — source-file, criticidade supporting, score 40
- [ai-context/coding_rules.md](03-SUPPORTING/shared/ai-context_coding_rules.md.md) — source-file, criticidade supporting, score 40
- [ai-context/database_schema.md](03-SUPPORTING/shared/ai-context_database_schema.md.md) — source-file, criticidade supporting, score 40
- [ai-context/important_files.md](03-SUPPORTING/shared/ai-context_important_files.md.md) — source-file, criticidade supporting, score 40
- [ai-context/project_context.md](03-SUPPORTING/shared/ai-context_project_context.md.md) — source-file, criticidade supporting, score 40
- [ai-context/system_flows.md](03-SUPPORTING/shared/ai-context_system_flows.md.md) — source-file, criticidade supporting, score 40
- [.agents/skills/porto-safe-implement/SKILL.md](03-SUPPORTING/shared/.agents_skills_porto-safe-implement_SKILL.md.md) — source-file, criticidade supporting, score 40

## 99-LOW-PRIORITY

### backend

_Nenhum arquivo_

### frontend

- [frontend/src/components/ui/accordion.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_accordion.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/alert-dialog.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_alert-dialog.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/alert.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_alert.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/avatar.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_avatar.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/badge.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_badge.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/button.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_button.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/calendar.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_calendar.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/card.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_card.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/carousel.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_carousel.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/chart.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_chart.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/checkbox.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_checkbox.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/collapsible.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_collapsible.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/dialog.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_dialog.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/dropdown-menu.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_dropdown-menu.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/form.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_form.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/input.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_input.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/label.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_label.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/menubar.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_menubar.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/nibo-logo.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_nibo-logo.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/popover.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_popover.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/progress.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_progress.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/radio-group.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_radio-group.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/scroll-area.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_scroll-area.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/select.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_select.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/separator.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_separator.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/sheet.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_sheet.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/sidebar.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_sidebar.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/skeleton.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_skeleton.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/slider.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_slider.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/switch.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_switch.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/table.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_table.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/tabs.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_tabs.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/textarea.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_textarea.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/toast.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_toast.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/toaster.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_toaster.tsx.md) — ui-component, criticidade supporting, score 10
- [frontend/src/components/ui/tooltip.tsx](99-LOW-PRIORITY/frontend/frontend_src_components_ui_tooltip.tsx.md) — ui-component, criticidade supporting, score 10

### ai

_Nenhum arquivo_

### shared

_Nenhum arquivo_

