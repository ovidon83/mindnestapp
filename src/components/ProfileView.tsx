import React, { useState, useEffect } from 'react';
import { useGenieNotesStore } from '../store';
import { fetchUserProfile, saveUserProfile } from '../lib/db';
import { UserProfile } from '../types';
import { Save, Loader2 } from 'lucide-react';
import Navigation from './Navigation';

const ProfileView: React.FC = () => {
  const { user, setCurrentView, signOut } = useGenieNotesStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    name: '',
    role: '',
    industry: '',
    location: '',
    interests: [],
    domains: [],
    goals: [],
    priorities: '',
    communicationStyle: undefined,
    preferredTone: undefined,
    workStyle: undefined,
    timeManagement: undefined,
    context: '',
  });

  const [interestInput, setInterestInput] = useState('');
  const [domainInput, setDomainInput] = useState('');
  const [goalInput, setGoalInput] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const existingProfile = await fetchUserProfile();
      if (existingProfile) {
        setProfile({
          name: existingProfile.name || '',
          role: existingProfile.role || '',
          industry: existingProfile.industry || '',
          location: existingProfile.location || '',
          interests: existingProfile.interests || [],
          domains: existingProfile.domains || [],
          goals: existingProfile.goals || [],
          priorities: existingProfile.priorities || '',
          communicationStyle: existingProfile.communicationStyle,
          preferredTone: existingProfile.preferredTone,
          workStyle: existingProfile.workStyle,
          timeManagement: existingProfile.timeManagement,
          context: existingProfile.context || '',
        });
      }
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      await saveUserProfile(profile);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const addInterest = () => {
    if (interestInput.trim() && !profile.interests?.includes(interestInput.trim())) {
      setProfile({
        ...profile,
        interests: [...(profile.interests || []), interestInput.trim()],
      });
      setInterestInput('');
    }
  };

  const removeInterest = (interest: string) => {
    setProfile({
      ...profile,
      interests: profile.interests?.filter(i => i !== interest) || [],
    });
  };

  const addDomain = () => {
    if (domainInput.trim() && !profile.domains?.includes(domainInput.trim())) {
      setProfile({
        ...profile,
        domains: [...(profile.domains || []), domainInput.trim()],
      });
      setDomainInput('');
    }
  };

  const removeDomain = (domain: string) => {
    setProfile({
      ...profile,
      domains: profile.domains?.filter(d => d !== domain) || [],
    });
  };

  const addGoal = () => {
    if (goalInput.trim() && !profile.goals?.includes(goalInput.trim())) {
      setProfile({
        ...profile,
        goals: [...(profile.goals || []), goalInput.trim()],
      });
      setGoalInput('');
    }
  };

  const removeGoal = (goal: string) => {
    setProfile({
      ...profile,
      goals: profile.goals?.filter(g => g !== goal) || [],
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation
        currentView="profile"
        onViewChange={setCurrentView}
        user={user}
        onLogout={signOut}
      />
      <div className="py-8 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Your Profile</h1>
            <p className="text-slate-600">
              Help us understand you better. This information will train the AI to make better decisions about your thoughts and provide more personalized insights.
            </p>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">Profile saved successfully!</p>
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-8">
            {/* Personal Information */}
            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Personal Information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Role / Job Title</label>
                  <input
                    type="text"
                    value={profile.role}
                    onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Software Engineer, Coach, Designer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Industry</label>
                  <input
                    type="text"
                    value={profile.industry}
                    onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Technology, Sports, Design"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="City, Country"
                  />
                </div>
              </div>
            </section>

            {/* Interests */}
            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Interests</h2>
              <p className="text-sm text-slate-600 mb-3">What topics interest you? (e.g., soccer, design, technology, health)</p>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Add an interest"
                />
                <button
                  onClick={addInterest}
                  className="px-4 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.interests?.map((interest) => (
                  <span
                    key={interest}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-2"
                  >
                    {interest}
                    <button
                      onClick={() => removeInterest(interest)}
                      className="text-indigo-500 hover:text-indigo-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </section>

            {/* Domains of Expertise */}
            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Areas of Expertise</h2>
              <p className="text-sm text-slate-600 mb-3">What are you knowledgeable about? (e.g., web development, coaching, marketing)</p>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addDomain()}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Add an area of expertise"
                />
                <button
                  onClick={addDomain}
                  className="px-4 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.domains?.map((domain) => (
                  <span
                    key={domain}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-2"
                  >
                    {domain}
                    <button
                      onClick={() => removeDomain(domain)}
                      className="text-purple-500 hover:text-purple-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </section>

            {/* Goals */}
            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Goals</h2>
              <p className="text-sm text-slate-600 mb-3">What are you working towards? (e.g., build a personal brand, learn TypeScript, improve coaching skills)</p>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Add a goal"
                />
                <button
                  onClick={addGoal}
                  className="px-4 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.goals?.map((goal) => (
                  <span
                    key={goal}
                    className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm flex items-center gap-2"
                  >
                    {goal}
                    <button
                      onClick={() => removeGoal(goal)}
                      className="text-pink-500 hover:text-pink-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </section>

            {/* Priorities */}
            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">What Matters Most</h2>
              <p className="text-sm text-slate-600 mb-3">What are your top priorities right now?</p>
              <textarea
                value={profile.priorities}
                onChange={(e) => setProfile({ ...profile, priorities: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                rows={3}
                placeholder="e.g., Building my personal brand, improving my coaching skills, advancing my career..."
              />
            </section>

            {/* Preferences */}
            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Preferences</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Communication Style</label>
                  <select
                    value={profile.communicationStyle || ''}
                    onChange={(e) => setProfile({ ...profile, communicationStyle: e.target.value as any || undefined })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select...</option>
                    <option value="concise">Concise - Get to the point quickly</option>
                    <option value="detailed">Detailed - I want thorough explanations</option>
                    <option value="balanced">Balanced - A mix of both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Tone</label>
                  <select
                    value={profile.preferredTone || ''}
                    onChange={(e) => setProfile({ ...profile, preferredTone: e.target.value as any || undefined })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select...</option>
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="friendly">Friendly</option>
                    <option value="analytical">Analytical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Work Style</label>
                  <select
                    value={profile.workStyle || ''}
                    onChange={(e) => setProfile({ ...profile, workStyle: e.target.value as any || undefined })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select...</option>
                    <option value="structured">Structured - I like clear plans and schedules</option>
                    <option value="flexible">Flexible - I adapt as I go</option>
                    <option value="hybrid">Hybrid - A mix of both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Best Time for Deep Work</label>
                  <select
                    value={profile.timeManagement || ''}
                    onChange={(e) => setProfile({ ...profile, timeManagement: e.target.value as any || undefined })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select...</option>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Additional Context */}
            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Additional Context</h2>
              <p className="text-sm text-slate-600 mb-3">Anything else that would help the AI understand you better?</p>
              <textarea
                value={profile.context}
                onChange={(e) => setProfile({ ...profile, context: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                rows={4}
                placeholder="e.g., I'm a soccer coach focused on youth development. I'm passionate about improving the quality of training in the US..."
              />
            </section>

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-slate-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-white rounded-lg font-medium hover:from-blue-700 hover:via-cyan-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Profile</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default ProfileView;

