import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@/components/Layout";
import { DashboardPage } from "@/pages/Dashboard";
import { ExhibitionListPage } from "@/pages/Exhibition/List";
import { BookingCalendarPage } from "@/pages/Booking/Calendar";
import { BookingFormPage } from "@/pages/Booking/Form";
import { BookingSuccessPage } from "@/pages/Booking/Success";
import { MyBookingsPage } from "@/pages/Booking/MyBookings";
import { VerificationPage } from "@/pages/Verification";
import { FeedbackSubmitPage } from "@/pages/Feedback/Submit";
import { FeedbackListPage } from "@/pages/Feedback/List";
import { useAppStore } from "@/store/useAppStore";

export default function App() {
  const { init, initialized } = useAppStore();

  useEffect(() => {
    init();
  }, [init]);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-cream">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/exhibitions" element={<ExhibitionListPage />} />
          <Route path="/verification" element={<VerificationPage />} />
          <Route path="/feedback/list" element={<FeedbackListPage />} />

          <Route path="/booking" element={<BookingCalendarPage />} />
          <Route path="/booking/form" element={<BookingFormPage />} />
          <Route path="/booking/success/:id" element={<BookingSuccessPage />} />
          <Route path="/booking/my" element={<MyBookingsPage />} />
          <Route path="/feedback" element={<FeedbackSubmitPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
