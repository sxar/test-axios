import { useState } from 'react';
import './App.css';

import GetRequests from './components/tab1/GetRequests';
import PostPutPatch from './components/tab1/PostPutPatch';
import DeleteAndOthers from './components/tab1/DeleteAndOthers';
import HeadersAuth from './components/tab2/HeadersAuth';
import TimeoutsCancellation from './components/tab2/TimeoutsCancellation';
import ResponseTypes from './components/tab2/ResponseTypes';
import RequestInterceptors from './components/tab3/RequestInterceptors';
import ResponseInterceptors from './components/tab3/ResponseInterceptors';
import ErrorHandling from './components/tab3/ErrorHandling';
import FileUpload from './components/tab4/FileUpload';
import FileDownload from './components/tab4/FileDownload';
import CustomInstances from './components/tab4/CustomInstances';
import RealWorldPatterns from './components/tab4/RealWorldPatterns';
import PlaceholderScenario from './components/PlaceholderScenario';

interface MenuItem {
  id: string;
  label: string;
  category: string;
  component: React.ComponentType;
}

const menuItems: MenuItem[] = [
  { id: 'get-requests', label: 'GET Requests', category: 'Tab 1: HTTP Methods & Basics', component: GetRequests },
  { id: 'post-put-patch', label: 'POST, PUT, PATCH Requests', category: 'Tab 1: HTTP Methods & Basics', component: PostPutPatch },
  { id: 'delete-others', label: 'DELETE & Other Methods', category: 'Tab 1: HTTP Methods & Basics', component: DeleteAndOthers },
  { id: 'headers-auth', label: 'Headers & Authentication', category: 'Tab 2: Configuration & Features', component: HeadersAuth },
  { id: 'timeouts-cancellation', label: 'Timeouts & Cancellation', category: 'Tab 2: Configuration & Features', component: TimeoutsCancellation },
  { id: 'response-types', label: 'Response Types & Transformation', category: 'Tab 2: Configuration & Features', component: ResponseTypes },
  { id: 'request-interceptors', label: 'Request Interceptors', category: 'Tab 3: Interceptors & Error Handling', component: RequestInterceptors },
  { id: 'response-interceptors', label: 'Response Interceptors', category: 'Tab 3: Interceptors & Error Handling', component: ResponseInterceptors },
  { id: 'error-handling', label: 'Error Handling', category: 'Tab 3: Interceptors & Error Handling', component: ErrorHandling },
  { id: 'real-world-patterns', label: 'Real-World Patterns', category: 'Tab 4: Patterns & Advanced Features', component: RealWorldPatterns },
  { id: 'file-upload', label: 'File Upload', category: 'Tab 4: Patterns & Advanced Features', component: FileUpload },
  { id: 'file-download', label: 'File Download', category: 'Tab 4: Patterns & Advanced Features', component: FileDownload },
  { id: 'custom-instances', label: 'Custom Instances & Defaults', category: 'Tab 4: Patterns & Advanced Features', component: CustomInstances }
];

const categories = [
  'Tab 1: HTTP Methods & Basics',
  'Tab 2: Configuration & Features',
  'Tab 3: Interceptors & Error Handling',
  'Tab 4: Patterns & Advanced Features'
];

function App() {
  const [activeTest, setActiveTest] = useState('get-requests');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(categories);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const ActiveComponent = menuItems.find(item => item.id === activeTest)?.component;

  return (
    <div className="app">
      <header className="app-header">
        <h1>TestAxios | Axios HTTP Client Test Application</h1>
      </header>

      <div className="app-layout">
        <aside className="sidebar">
          <nav className="sidebar-nav">
            {categories.map(category => {
              const categoryItems = menuItems.filter(item => item.category === category);
              const isExpanded = expandedCategories.includes(category);

              return (
                <div key={category} className="menu-category">
                  <button
                    className="category-header"
                    onClick={() => toggleCategory(category)}
                    data-testid={`category-${category.toLowerCase().replace(/\s+|:/g, '-')}`}
                  >
                    <span className={`category-icon ${isExpanded ? 'expanded' : ''}`}>▶</span>
                    <span className="category-label" title={category}>
                      {category}
                  </button>

                  {isExpanded && (
                    <ul className="category-items">
                      {categoryItems.map(item => (
                        <li key={item.id}>
                          <button
                            className={`menu-item ${activeTest === item.id ? 'active' : ''}`}
                            onClick={() => setActiveTest(item.id)}
                            data-testid={`test-${item.id}`}
                          >
                            {item.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        <main className="main-content">
          {ActiveComponent && <ActiveComponent />}
        </main>
      </div>
    </div>
  );
}

export default App;
