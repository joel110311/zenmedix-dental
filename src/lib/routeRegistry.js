import { lazy } from 'react';

function createLazyRoute(loader) {
    const RouteComponent = lazy(loader);
    RouteComponent.preload = loader;
    return RouteComponent;
}

const loadLogin = () => import('../pages/Login');
const loadDashboard = () => import('../pages/Dashboard');
const loadPatientList = () => import('../pages/patients/PatientList');
const loadPatientForm = () => import('../pages/patients/PatientForm');
const loadPatientOverview = () => import('../pages/patient-profile/PatientOverview');
const loadPatientHistory = () => import('../pages/patient-profile/PatientHistory');
const loadConsultationList = () => import('../pages/patient-profile/ConsultationList');
const loadNewConsultation = () => import('../pages/patient-profile/NewConsultation');
const loadLabResults = () => import('../pages/patient-profile/LabResults');
const loadEvolutionNotes = () => import('../pages/patient-profile/EvolutionNotes');
const loadOdontogramPage = () => import('../pages/patient-profile/OdontogramPage');
const loadBudgetsPage = () => import('../pages/patient-profile/BudgetsPage');
const loadAppointmentsPage = () => import('../pages/appointments/AppointmentsPage');
const loadSettingsPage = () => import('../pages/settings/SettingsPage');
const loadRecipeLayoutEditor = () => import('../pages/settings/RecipeLayoutEditor');
const loadAuditLogPage = () => import('../pages/admin/AuditLogPage');
const loadPrintRecipe = () => import('../pages/print/PrintRecipe');
const loadPrintHistory = () => import('../pages/print/PrintHistory');
const loadPrintStudyRequest = () => import('../pages/print/PrintStudyRequest');
const loadPrintBudgetPlan = () => import('../pages/print/PrintBudgetPlan');

export const Login = createLazyRoute(loadLogin);
export const Dashboard = createLazyRoute(loadDashboard);
export const PatientList = createLazyRoute(loadPatientList);
export const PatientForm = createLazyRoute(loadPatientForm);
export const PatientOverview = createLazyRoute(loadPatientOverview);
export const PatientHistory = createLazyRoute(loadPatientHistory);
export const ConsultationList = createLazyRoute(loadConsultationList);
export const NewConsultation = createLazyRoute(loadNewConsultation);
export const LabResults = createLazyRoute(loadLabResults);
export const EvolutionNotes = createLazyRoute(loadEvolutionNotes);
export const OdontogramPage = createLazyRoute(loadOdontogramPage);
export const BudgetsPage = createLazyRoute(loadBudgetsPage);
export const AppointmentsPage = createLazyRoute(loadAppointmentsPage);
export const SettingsPage = createLazyRoute(loadSettingsPage);
export const RecipeLayoutEditor = createLazyRoute(loadRecipeLayoutEditor);
export const AuditLogPage = createLazyRoute(loadAuditLogPage);
export const PrintRecipe = createLazyRoute(loadPrintRecipe);
export const PrintHistory = createLazyRoute(loadPrintHistory);
export const PrintStudyRequest = createLazyRoute(loadPrintStudyRequest);
export const PrintBudgetPlan = createLazyRoute(loadPrintBudgetPlan);

const preloadMatchers = [
    { test: (path) => path === '/login', loader: loadLogin },
    { test: (path) => path === '/', loader: loadDashboard },
    { test: (path) => /^\/pacientes\/[^/]+\/resumen$/.test(path), loader: loadPatientOverview },
    { test: (path) => /^\/pacientes\/[^/]+\/antecedentes$/.test(path), loader: loadPatientHistory },
    { test: (path) => /^\/pacientes\/[^/]+\/historial$/.test(path), loader: loadConsultationList },
    { test: (path) => /^\/pacientes\/[^/]+\/notas$/.test(path), loader: loadEvolutionNotes },
    { test: (path) => /^\/pacientes\/[^/]+\/consulta\/nueva$/.test(path), loader: loadNewConsultation },
    { test: (path) => /^\/pacientes\/[^/]+\/analisis$/.test(path), loader: loadLabResults },
    { test: (path) => /^\/pacientes\/[^/]+\/odontograma$/.test(path), loader: loadOdontogramPage },
    { test: (path) => /^\/pacientes\/[^/]+\/presupuestos$/.test(path), loader: loadBudgetsPage },
    { test: (path) => /^\/imprimir\/receta\/[^/]+$/.test(path), loader: loadPrintRecipe },
    { test: (path) => /^\/imprimir\/historia\/[^/]+$/.test(path), loader: loadPrintHistory },
    { test: (path) => /^\/imprimir\/solicitud\/[^/]+$/.test(path), loader: loadPrintStudyRequest },
    { test: (path) => /^\/imprimir\/presupuesto\/[^/]+$/.test(path), loader: loadPrintBudgetPlan },
    { test: (path) => path === '/pacientes/nuevo' || /^\/pacientes\/editar\/[^/]+$/.test(path), loader: loadPatientForm },
    { test: (path) => path === '/pacientes', loader: loadPatientList },
    { test: (path) => path === '/citas', loader: loadAppointmentsPage },
    { test: (path) => path === '/configuracion', loader: loadSettingsPage },
    { test: (path) => path === '/configuracion/receta', loader: loadRecipeLayoutEditor },
    { test: (path) => path === '/auditoria', loader: loadAuditLogPage },
];

export function preloadRoute(path) {
    const normalizedPath = typeof path === 'string' ? path.split('?')[0].split('#')[0] : '';
    const match = preloadMatchers.find(({ test }) => test(normalizedPath));

    return match ? match.loader() : Promise.resolve();
}
