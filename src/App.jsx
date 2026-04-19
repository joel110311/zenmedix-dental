import { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PatientProvider } from './context/PatientContext';
import { SettingsProvider } from './context/SettingsContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { PatientLayout } from './components/layout/PatientLayout';
import { FullScreenLoader } from './components/ui/RouteLoader';
import {
    AppointmentsPage,
    AuditLogPage,
    BudgetsPage,
    ConsultationList,
    Dashboard,
    EvolutionNotes,
    LabResults,
    Login,
    NewConsultation,
    OdontogramPage,
    PatientForm,
    PatientHistory,
    PatientList,
    PatientOverview,
    PrintBudgetPlan,
    PrintHistory,
    PrintRecipe,
    PrintStudyRequest,
    RecipeLayoutEditor,
    SettingsPage,
} from './lib/routeRegistry';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <FullScreenLoader
        title="Validando acceso"
        message="Cargando permisos y contexto clinico de forma segura."
      />
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  return children;
};

const renderStandaloneRoute = (routeElement) => (
  <Suspense fallback={<FullScreenLoader />}>
    {routeElement}
  </Suspense>
);

function App() {
  return (
    <Router>
      <Toaster position="top-right" richColors closeButton />
      <AuthProvider>
        <SettingsProvider>
          <PatientProvider>
            <Routes>
              <Route path="/login" element={renderStandaloneRoute(<Login />)} />

              <Route path="/" element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />

                {/* Patient Directory */}
                <Route path="pacientes" element={<PatientList />} />
                <Route path="pacientes/nuevo" element={<PatientForm />} />
                <Route path="pacientes/editar/:id" element={<PatientForm />} />

                {/* V3: Appointments */}
                <Route path="citas" element={<AppointmentsPage />} />

                {/* V3: Settings */}
                <Route path="configuracion" element={<SettingsPage />} />
                <Route path="configuracion/receta" element={<RecipeLayoutEditor />} />

                {/* V3: Audit Log - NOM-024 */}
                <Route path="auditoria" element={<AuditLogPage />} />

                {/* V2: Nested Patient Profile Routes */}
                <Route path="pacientes/:id" element={<PatientLayout />}>
                  <Route index element={<Navigate to="resumen" replace />} />
                  <Route path="resumen" element={<PatientOverview />} />
                  <Route path="antecedentes" element={<PatientHistory />} />
                  <Route path="historial" element={<ConsultationList />} />
                  <Route path="notas" element={<EvolutionNotes />} />
                  <Route path="consulta/nueva" element={<NewConsultation />} />
                  <Route path="analisis" element={<LabResults />} />
                  <Route path="odontograma" element={<OdontogramPage />} />
                  <Route path="presupuestos" element={<BudgetsPage />} />
                </Route>
              </Route>

              {/* Print Views (No sidebar) */}
              <Route path="/imprimir/receta/:id" element={
                <ProtectedRoute>
                  {renderStandaloneRoute(<PrintRecipe />)}
                </ProtectedRoute>
              } />
              <Route path="/imprimir/historia/:id" element={
                <ProtectedRoute>
                  {renderStandaloneRoute(<PrintHistory />)}
                </ProtectedRoute>
              } />
              <Route path="/imprimir/solicitud/:id" element={
                <ProtectedRoute>
                  {renderStandaloneRoute(<PrintStudyRequest />)}
                </ProtectedRoute>
              } />
              <Route path="/imprimir/presupuesto/:id" element={
                <ProtectedRoute>
                  {renderStandaloneRoute(<PrintBudgetPlan />)}
                </ProtectedRoute>
              } />
            </Routes>
          </PatientProvider>
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
