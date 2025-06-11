import { useState, useEffect } from 'react';
import Dashboard from '../components/Dashboard'; // Adjust path if needed
import './index.css';


function App() {
  const [userId, setUserId] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [password, setpassword] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isLogin, setIsLogin] = useState<boolean>(true);

  useEffect(() => {
    console.log("in the useEffect");
  
    const checkUserId = async () => {
      try {
        const storedUserId = await new Promise<string | undefined>((resolve) => {
          chrome.storage.local.get('userid', (result) => {
            resolve(result.userid);
          });
        });
  
        console.log('User ID from storage:', storedUserId);
  
        if (storedUserId) {
          setUserId(storedUserId);
          setIsLoggedIn(true);
        }
      } catch (err) {
        console.error("Error reading from chrome storage:", err);
      } finally {
        setIsLoading(false);
      }
    };
  
    checkUserId();
  }, []);
  

  const handleCreateUser = async () => {
    if (!email || !name || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('http://localhost:3000/api/CreateUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const id = data.userId || data.user?._id;
        setUserId(id);
        chrome.storage.local.set({ userid: id});
        chrome.storage.local.set({ userEmail: email});
        console.log("userid setted in localstorage of chrome ....... ")
        setIsLoggedIn(true);
      } else {
        setError(data.error || 'Failed to create account');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }
    if(!password) {
      setError('Please enter your password')
    }

    try {
      setIsLoading(true);
      setError('');
      console.log("hi there iam here in try block")

      const response = await fetch(`http://localhost:3000/api/CreateUser?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
      const data = await response.json();

      if (response.ok) {
        const id = data.user._id;
        setUserId(id);
        chrome.storage.local.set({ userid: id});
        chrome.storage.local.set({ userEmail: email});
        console.log("userid setted in localstorage of chrome ....... ")
        setIsLoggedIn(true);
      } else {
        setError(data.error || 'User not found');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    chrome.storage.local.remove(['userid', 'userEmail'], () => {
      if (chrome.runtime.lastError) {
        console.error('Error removing data:', chrome.runtime.lastError);
      } else {
        console.log('User data removed successfully');
      }
    });
    
    setUserId('');
    setEmail('');
    setName('');
    setIsLoggedIn(false);
    setError('');
  };

  if (isLoading) {
    return (
      <div className="w-80 h-96 flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  console.log("is logged in and userid " + isLoggedIn + "userId is " + userId)
  
  const isFullscreen = window.location.href.includes('index.html'); // Or use "index.html" if that's more reliable


  if (isLoggedIn && userId) {
    return (
      <div className={isFullscreen ? 'w-full min-h-screen bg-slate-900' : 'w-80 min-h-96 bg-slate-900'}>
    {isFullscreen && (
      <div className="bg-slate-900 shadow-sm border-b px-6 py-4 w-full flex justify-between items-center">
        <h1 className="text-xl font-semibold text-white">Productivity Tracker</h1>
        <button
          onClick={handleLogout}
          className="bg-blue-800 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-900"
        >
          Logout
        </button>
      </div>
    )}
        <div className="p-4">
          <Dashboard userId={userId} />
        </div>
  </div>
    );
  }

  return (
    <div className="w-80 min-h-96 bg-gray-50 p-4">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">📈</h1>
        <h2 className="text-xl font-extrabold text-gray-900">Productivity Tracker</h2>
        <p className="mt-1 text-xs text-gray-600">Track your time and boost productivity</p>
      </div>

      <div className="bg-white p-4 shadow rounded-lg">
        <div className="mb-4 flex rounded-md shadow-sm">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 px-3 text-xs font-medium rounded-l-md ${
              isLogin ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 px-3 text-xs font-medium rounded-r-md ${
              !isLogin ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-xs">
            {error}
          </div>
        )}

        <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-2 py-2 text-sm border rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your email"
            />

            <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setpassword(e.target.value)}
              className="w-full px-2 py-2 text-sm border rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your password"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Full name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-2 py-2 text-sm border rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full name"
              />
            </div>
          )}

          <button
            type="button"
            onClick={isLogin ? handleLogin : handleCreateUser}
            disabled={isLoading}
            className="w-full py-2 px-4 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : isLogin ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="mt-4 text-center text-xs">
          <span>
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-blue-600 hover:text-blue-500 font-medium underline"
            >
              {isLogin ? 'Create one' : 'Sign in'}
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;