import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Button from './ui/Button';
import submissionService, { type Submission, type GradeSubmissionData } from '../services/submissionService';

interface GradeSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: Submission;
  onGradeSuccess: (gradedSubmission: Submission) => void;
}

const GradeSubmissionModal: React.FC<GradeSubmissionModalProps> = ({
  isOpen,
  onClose,
  submission,
  onGradeSuccess
}) => {
  const [grade, setGrade] = useState<string>(submission.grade?.toString() || '');
  const [feedback, setFeedback] = useState<string>(submission.feedback || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const gradeNumber = parseFloat(grade);
      if (isNaN(gradeNumber) || gradeNumber < 0 || gradeNumber > submission.assignment.max_score) {
        throw new Error(`Grade must be between 0 and ${submission.assignment.max_score}`);
      }

      const gradeData: GradeSubmissionData = {
        grade: gradeNumber,
        feedback: feedback.trim() || undefined
      };

      const gradedSubmission = await submissionService.gradeSubmission(submission.submission_id, gradeData);
      onGradeSuccess(gradedSubmission);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to grade submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Grade Submission
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Submission Details
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Student:</span>
                <p className="text-gray-900 dark:text-white">
                  {submission.user.first_name} {submission.user.last_name} ({submission.user.email})
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Assignment:</span>
                <p className="text-gray-900 dark:text-white">{submission.assignment.title}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Submitted:</span>
                <p className="text-gray-900 dark:text-white">
                  {new Date(submission.submitted_at).toLocaleString()}
                </p>
              </div>
              {submission.submission_text && (
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Text Submission:</span>
                  <p className="text-gray-900 dark:text-white mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    {submission.submission_text}
                  </p>
                </div>
              )}
              {submission.cloudinary_url && (
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">File Submission:</span>
                  <a
                    href={submission.cloudinary_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                  >
                    View Submitted File
                  </a>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="grade" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Grade (out of {submission.assignment.max_score})
              </label>
              <input
                type="number"
                id="grade"
                min="0"
                max={submission.assignment.max_score}
                step="0.1"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Feedback (Optional)
              </label>
              <textarea
                id="feedback"
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Provide feedback for the student..."
              />
            </div>

            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Grading...' : 'Grade Submission'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export { GradeSubmissionModal };
export default GradeSubmissionModal;