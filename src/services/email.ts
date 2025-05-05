/**
 * Represents an email message.
 */
export interface Email {
  /**
   * The recipient's email address.
   */
  to: string;
  /**
   * The subject of the email.
   */
  subject: string;
  /**
   * The body of the email.
   */
  body: string;
}

/**
 * Asynchronously sends an email message.
 *
 * @param email The email message to send.
 * @returns A promise that resolves when the email is sent successfully.
 */
export async function sendEmail(email: Email): Promise<void> {
  // TODO: Implement this by calling an Email API.

  console.log(`Sending email to ${email.to} with subject ${email.subject}`);
}
