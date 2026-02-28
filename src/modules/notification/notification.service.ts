import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly templates = new Map<string, HandlebarsTemplateDelegate>();

  constructor() {
    this.loadTemplates();
  }

  private loadTemplates() {
    const templateDir = path.join(__dirname, 'templates');
    try {
      const files = fs.readdirSync(templateDir);
      for (const file of files) {
        if (file.endsWith('.hbs')) {
          const name = file.replace('.hbs', '');
          const content = fs.readFileSync(
            path.join(templateDir, file),
            'utf-8',
          );
          this.templates.set(name, Handlebars.compile(content));
        }
      }
    } catch {
      this.logger.warn(
        'Template directory not found, skipping template loading',
      );
    }
  }

  async sendEmail(to: string, template: string, data: Record<string, unknown>) {
    const compiledTemplate = this.templates.get(template);
    const html = compiledTemplate
      ? compiledTemplate(data)
      : JSON.stringify(data);
    this.logger.log(`Sending email to ${to}: template=${template}`);
    this.logger.debug(`Email HTML: ${html}`);
  }

  async sendPushNotification(userId: string, title: string, body: string) {
    this.logger.log(`Push notification to ${userId}: ${title} - ${body}`);
  }
}
