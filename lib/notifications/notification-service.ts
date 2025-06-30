// =============================================
// NOVAGUARD NOTIFICATION SERVICE
// Multi-channel notification system (Email, Discord, Webhook)
// =============================================

import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'
import { ContractAlert } from '@/lib/monitoring/contract-monitor'
import { MEVAlert } from '@/lib/monitoring/mev-detector'

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type NotificationChannel = 'email' | 'discord' | 'webhook' | 'sms' | 'push'

export interface NotificationPreferences {
  userId: string
  channels: {
    email: {
      enabled: boolean
      address: string
      frequency: 'immediate' | 'hourly' | 'daily'
      types: string[]
    }
    discord: {
      enabled: boolean
      webhookUrl: string
      frequency: 'immediate' | 'hourly'
      types: string[]
    }
    webhook: {
      enabled: boolean
      url: string
      secret: string
      frequency: 'immediate'
      types: string[]
    }
    sms: {
      enabled: boolean
      phoneNumber: string
      frequency: 'immediate'
      types: string[] // Only critical alerts
    }
    push: {
      enabled: boolean
      frequency: 'immediate'
      types: string[]
    }
  }
}

export interface NotificationTemplate {
  type: string
  channel: NotificationChannel
  subject: string
  template: string
  variables: string[]
}

export class NotificationService {
  private emailTransporter: nodemailer.Transporter

  constructor() {
    this.initializeEmailTransporter()
  }

  // Initialize email transporter
  private initializeEmailTransporter() {
    this.emailTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST!,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!
      }
    })
  }

  // Send security alert notification
  async sendSecurityAlert(alert: ContractAlert, userId: string): Promise<void> {
    try {
      const preferences = await this.getUserNotificationPreferences(userId)
      if (!preferences) return

      const notificationData = {
        type: 'security_alert',
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        contractId: alert.contractId,
        transactionHash: alert.transactionHash,
        timestamp: alert.timestamp.toISOString(),
        explorerUrl: alert.transactionHash ? `https://etherscan.io/tx/${alert.transactionHash}` : undefined
      }

      // Send via enabled channels
      const promises: Promise<void>[] = []

      if (preferences.channels.email.enabled && 
          preferences.channels.email.types.includes('security_alert')) {
        promises.push(this.sendEmailNotification(preferences.channels.email.address, notificationData))
      }

      if (preferences.channels.discord.enabled && 
          preferences.channels.discord.types.includes('security_alert')) {
        promises.push(this.sendDiscordNotification(preferences.channels.discord.webhookUrl, notificationData))
      }

      if (preferences.channels.webhook.enabled && 
          preferences.channels.webhook.types.includes('security_alert')) {
        promises.push(this.sendWebhookNotification(preferences.channels.webhook, notificationData))
      }

      if (alert.severity === 'critical' && preferences.channels.sms.enabled) {
        promises.push(this.sendSMSNotification(preferences.channels.sms.phoneNumber, notificationData))
      }

      await Promise.allSettled(promises)

      // Log notification
      await this.logNotification(userId, 'security_alert', notificationData)

    } catch (error) {
      console.error('Error sending security alert notification:', error)
    }
  }

  // Send MEV alert notification
  async sendMEVAlert(alert: MEVAlert, userId: string): Promise<void> {
    try {
      const preferences = await this.getUserNotificationPreferences(userId)
      if (!preferences) return

      const notificationData = {
        type: 'mev_alert',
        title: `MEV ${alert.attackType} detected`,
        description: alert.description,
        riskLevel: alert.riskLevel,
        confidence: alert.confidence,
        attackType: alert.attackType,
        contractId: alert.contractId,
        transactionHash: alert.transactionHash,
        attackerAddress: alert.attackerAddress,
        victimAddress: alert.victimAddress,
        mevProfit: alert.mevProfit,
        timestamp: alert.timestamp.toISOString(),
        explorerUrl: `https://etherscan.io/tx/${alert.transactionHash}`
      }

      // Send via enabled channels
      const promises: Promise<void>[] = []

      if (preferences.channels.email.enabled && 
          preferences.channels.email.types.includes('mev_alert')) {
        promises.push(this.sendEmailNotification(preferences.channels.email.address, notificationData))
      }

      if (preferences.channels.discord.enabled && 
          preferences.channels.discord.types.includes('mev_alert')) {
        promises.push(this.sendDiscordNotification(preferences.channels.discord.webhookUrl, notificationData))
      }

      if (preferences.channels.webhook.enabled && 
          preferences.channels.webhook.types.includes('mev_alert')) {
        promises.push(this.sendWebhookNotification(preferences.channels.webhook, notificationData))
      }

      await Promise.allSettled(promises)

      // Log notification
      await this.logNotification(userId, 'mev_alert', notificationData)

    } catch (error) {
      console.error('Error sending MEV alert notification:', error)
    }
  }

  // Send email notification
  private async sendEmailNotification(email: string, data: any): Promise<void> {
    try {
      const template = await this.getEmailTemplate(data.type)
      const html = this.renderTemplate(template, data)

      await this.emailTransporter.sendMail({
        from: `"NovaGuard Security" <${process.env.SMTP_FROM}>`,
        to: email,
        subject: this.renderSubject(data),
        html
      })

      console.log(`📧 Email notification sent to ${email}`)
    } catch (error) {
      console.error('Error sending email notification:', error)
      throw error
    }
  }

  // Send Discord notification
  private async sendDiscordNotification(webhookUrl: string, data: any): Promise<void> {
    try {
      const embed = this.createDiscordEmbed(data)

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          embeds: [embed]
        })
      })

      if (!response.ok) {
        throw new Error(`Discord webhook failed: ${response.statusText}`)
      }

      console.log(`🎮 Discord notification sent`)
    } catch (error) {
      console.error('Error sending Discord notification:', error)
      throw error
    }
  }

  // Send webhook notification
  private async sendWebhookNotification(webhookConfig: any, data: any): Promise<void> {
    try {
      const payload = {
        ...data,
        timestamp: new Date().toISOString(),
        source: 'novaguard'
      }

      // Create signature if secret is provided
      let headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'NovaGuard/1.0'
      }

      if (webhookConfig.secret) {
        const crypto = require('crypto')
        const signature = crypto
          .createHmac('sha256', webhookConfig.secret)
          .update(JSON.stringify(payload))
          .digest('hex')
        
        headers['X-NovaGuard-Signature'] = `sha256=${signature}`
      }

      const response = await fetch(webhookConfig.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.statusText}`)
      }

      console.log(`🔗 Webhook notification sent`)
    } catch (error) {
      console.error('Error sending webhook notification:', error)
      throw error
    }
  }

  // Send SMS notification (using Twilio)
  private async sendSMSNotification(phoneNumber: string, data: any): Promise<void> {
    try {
      // This would integrate with Twilio or another SMS service
      const message = this.createSMSMessage(data)
      
      // Placeholder for SMS implementation
      console.log(`📱 SMS notification would be sent to ${phoneNumber}: ${message}`)
      
      // Actual Twilio implementation would go here:
      /*
      const twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN)
      await twilio.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE,
        to: phoneNumber
      })
      */
    } catch (error) {
      console.error('Error sending SMS notification:', error)
      throw error
    }
  }

  // Get user notification preferences
  private async getUserNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data || null
    } catch (error) {
      console.error('Error getting notification preferences:', error)
      return null
    }
  }

  // Get email template
  private async getEmailTemplate(type: string): Promise<string> {
    const templates: Record<string, string> = {
      security_alert: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1>🚨 Security Alert</h1>
          </div>
          <div style="padding: 20px; background: #f9fafb;">
            <h2>{{title}}</h2>
            <p><strong>Severity:</strong> <span style="color: {{severityColor}};">{{severity}}</span></p>
            <p><strong>Description:</strong> {{description}}</p>
            <p><strong>Contract:</strong> {{contractId}}</p>
            {{#if transactionHash}}
            <p><strong>Transaction:</strong> <a href="{{explorerUrl}}">{{transactionHash}}</a></p>
            {{/if}}
            <p><strong>Time:</strong> {{timestamp}}</p>
            
            <div style="margin-top: 30px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b;">
              <p><strong>⚠️ Action Required:</strong> Please review your smart contract immediately and take appropriate security measures.</p>
            </div>
          </div>
          <div style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
            <p>This alert was generated by NovaGuard Security Monitoring</p>
            <p><a href="https://novaguard.app">Visit Dashboard</a> | <a href="https://novaguard.app/settings/notifications">Manage Notifications</a></p>
          </div>
        </div>
      `,
      mev_alert: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #ea580c; color: white; padding: 20px; text-align: center;">
            <h1>⚡ MEV Alert</h1>
          </div>
          <div style="padding: 20px; background: #f9fafb;">
            <h2>{{title}}</h2>
            <p><strong>Attack Type:</strong> {{attackType}}</p>
            <p><strong>Risk Level:</strong> <span style="color: {{riskColor}};">{{riskLevel}}</span></p>
            <p><strong>Confidence:</strong> {{confidence}}%</p>
            <p><strong>Description:</strong> {{description}}</p>
            {{#if mevProfit}}
            <p><strong>Estimated MEV Profit:</strong> {{mevProfit}}</p>
            {{/if}}
            {{#if attackerAddress}}
            <p><strong>Attacker:</strong> {{attackerAddress}}</p>
            {{/if}}
            <p><strong>Transaction:</strong> <a href="{{explorerUrl}}">{{transactionHash}}</a></p>
            <p><strong>Time:</strong> {{timestamp}}</p>
            
            <div style="margin-top: 30px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b;">
              <p><strong>💡 Recommendation:</strong> Review the transaction details and consider implementing MEV protection mechanisms.</p>
            </div>
          </div>
          <div style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
            <p>This alert was generated by NovaGuard MEV Detection</p>
            <p><a href="https://novaguard.app">Visit Dashboard</a> | <a href="https://novaguard.app/settings/notifications">Manage Notifications</a></p>
          </div>
        </div>
      `
    }

    return templates[type] || templates.security_alert
  }

  // Render template with data
  private renderTemplate(template: string, data: any): string {
    let rendered = template

    // Simple template rendering (in production, use a proper template engine)
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      rendered = rendered.replace(regex, data[key] || '')
    })

    // Handle conditional blocks
    rendered = rendered.replace(/{{#if (\w+)}}([\s\S]*?){{\/if}}/g, (match, condition, content) => {
      return data[condition] ? content : ''
    })

    // Add severity colors
    const severityColors: Record<string, string> = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#dc2626'
    }

    const riskColors: Record<string, string> = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#dc2626'
    }

    rendered = rendered.replace('{{severityColor}}', severityColors[data.severity] || '#6b7280')
    rendered = rendered.replace('{{riskColor}}', riskColors[data.riskLevel] || '#6b7280')

    return rendered
  }

  // Render email subject
  private renderSubject(data: any): string {
    const subjects: Record<string, string> = {
      security_alert: `🚨 Security Alert: ${data.title}`,
      mev_alert: `⚡ MEV Alert: ${data.attackType} detected`
    }

    return subjects[data.type] || 'NovaGuard Alert'
  }

  // Create Discord embed
  private createDiscordEmbed(data: any): any {
    const colors: Record<string, number> = {
      low: 0x10b981,
      medium: 0xf59e0b,
      high: 0xef4444,
      critical: 0xdc2626
    }

    const color = colors[data.severity || data.riskLevel] || 0x6b7280

    const embed: any = {
      title: data.title,
      description: data.description,
      color,
      timestamp: data.timestamp,
      footer: {
        text: 'NovaGuard Security',
        icon_url: 'https://novaguard.app/logo.png'
      },
      fields: []
    }

    if (data.type === 'security_alert') {
      embed.fields.push(
        { name: 'Severity', value: data.severity, inline: true },
        { name: 'Contract', value: data.contractId, inline: true }
      )
      
      if (data.transactionHash) {
        embed.fields.push({
          name: 'Transaction',
          value: `[View on Explorer](${data.explorerUrl})`,
          inline: true
        })
      }
    } else if (data.type === 'mev_alert') {
      embed.fields.push(
        { name: 'Attack Type', value: data.attackType, inline: true },
        { name: 'Risk Level', value: data.riskLevel, inline: true },
        { name: 'Confidence', value: `${data.confidence}%`, inline: true }
      )

      if (data.mevProfit) {
        embed.fields.push({ name: 'MEV Profit', value: data.mevProfit, inline: true })
      }

      if (data.attackerAddress) {
        embed.fields.push({ name: 'Attacker', value: data.attackerAddress, inline: false })
      }

      embed.fields.push({
        name: 'Transaction',
        value: `[View on Explorer](${data.explorerUrl})`,
        inline: false
      })
    }

    return embed
  }

  // Create SMS message
  private createSMSMessage(data: any): string {
    if (data.type === 'security_alert') {
      return `🚨 NovaGuard Alert: ${data.title} (${data.severity}). Check your dashboard immediately.`
    } else if (data.type === 'mev_alert') {
      return `⚡ NovaGuard MEV Alert: ${data.attackType} detected (${data.riskLevel} risk). Check dashboard for details.`
    }

    return 'NovaGuard Alert: Check your dashboard for details.'
  }

  // Log notification
  private async logNotification(userId: string, type: string, data: any): Promise<void> {
    try {
      await supabase
        .from('notification_logs')
        .insert({
          user_id: userId,
          type,
          data,
          sent_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error logging notification:', error)
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      console.log(`✅ Notification preferences updated for user ${userId}`)
    } catch (error) {
      console.error('Error updating notification preferences:', error)
      throw error
    }
  }

  // Test notification channels
  async testNotificationChannels(userId: string): Promise<{
    email: boolean
    discord: boolean
    webhook: boolean
    sms: boolean
  }> {
    const results = {
      email: false,
      discord: false,
      webhook: false,
      sms: false
    }

    try {
      const preferences = await this.getUserNotificationPreferences(userId)
      if (!preferences) return results

      const testData = {
        type: 'test',
        title: 'Test Notification',
        description: 'This is a test notification from NovaGuard',
        timestamp: new Date().toISOString()
      }

      // Test email
      if (preferences.channels.email.enabled) {
        try {
          await this.sendEmailNotification(preferences.channels.email.address, testData)
          results.email = true
        } catch (error) {
          console.error('Email test failed:', error)
        }
      }

      // Test Discord
      if (preferences.channels.discord.enabled) {
        try {
          await this.sendDiscordNotification(preferences.channels.discord.webhookUrl, testData)
          results.discord = true
        } catch (error) {
          console.error('Discord test failed:', error)
        }
      }

      // Test webhook
      if (preferences.channels.webhook.enabled) {
        try {
          await this.sendWebhookNotification(preferences.channels.webhook, testData)
          results.webhook = true
        } catch (error) {
          console.error('Webhook test failed:', error)
        }
      }

      // Test SMS
      if (preferences.channels.sms.enabled) {
        try {
          await this.sendSMSNotification(preferences.channels.sms.phoneNumber, testData)
          results.sms = true
        } catch (error) {
          console.error('SMS test failed:', error)
        }
      }

    } catch (error) {
      console.error('Error testing notification channels:', error)
    }

    return results
  }
}

export default NotificationService
