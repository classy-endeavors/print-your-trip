import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import HowItWorks from "./pages/HIW";
import FAQ from "./pages/FAQ";
import BLOGS from "./pages/BLOGS";
import BLOG from "./pages/BLOG";
import Pricing from "./pages/Pricing";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import Create from "./pages/Create";

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/blogs" element={<BLOGS />} />
          <Route path="/blog" element={<BLOG />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route
            path="/terms-and-conditions"
            element={<TermsAndConditions />}
          />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        </Route>
        <Route element={<Layout variant="converter" />}>
          <Route path="/create" element={<Create />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
