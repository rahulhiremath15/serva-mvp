import React, { useState } from 'react';

const TechnicianSignup = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    skills: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const availableSkills = ['Smartphone', 'Laptop', 'Tablet', 'Gaming Console', 'Audio Gear'];

  const handleSkillToggle = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.skills.length === 0) return setError('Please select at least one skill');
    
    setIsLoading(true);
    setError('');
    
    try {
      // Call the SPECIAL route directly
      const response = await fetch('https://serva-backend.onrender.com/api/auth/register-technician', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          skills: formData.skills
        })
      });

      const result = await response.json();
      if (result.success) {
        // 1. HARD SAVE the credentials to LocalStorage
        // This guarantees other components (like Navbar) can see them immediately
        localStorage.setItem('token', result.token);
        localStorage.setItem('userRole', 'technician'); 
        
        // 2. FORCE A HARD RELOAD
        // Do NOT use 'navigate'. Use 'window.location.href'.
        // This forces the App to restart, read the LocalStorage, and render the correct Technician Navbar.
        window.location.href = '/technician-dashboard';
      } else {
        setError(result.message || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join as Technician</h1>
          <p className="text-gray-600">Start offering your repair services</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="First Name"
              required
              className="p-3 border rounded-lg w-full"
              onChange={e => setFormData({...formData, firstName: e.target.value})}
            />
            <input
              type="text"
              placeholder="Last Name"
              required
              className="p-3 border rounded-lg w-full"
              onChange={e => setFormData({...formData, lastName: e.target.value})}
            />
          </div>
          
          <input
            type="email"
            placeholder="Email Address"
            required
            className="p-3 border rounded-lg w-full"
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
          
          <input
            type="tel"
            placeholder="Phone Number"
            required
            className="p-3 border rounded-lg w-full"
            onChange={e => setFormData({...formData, phone: e.target.value})}
          />
          
          <input
            type="password"
            placeholder="Password"
            required
            className="p-3 border rounded-lg w-full"
            onChange={e => setFormData({...formData, password: e.target.value})}
          />
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Your Skills</label>
            <div className="flex flex-wrap gap-2">
              {availableSkills.map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleSkillToggle(skill)}
                  className={`px-4 py-2 rounded-full border transition-all ${
                    formData.skills.includes(skill)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
          
          <button
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all"
          >
            {isLoading ? 'Processing...' : 'Apply as Technician'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TechnicianSignup;
