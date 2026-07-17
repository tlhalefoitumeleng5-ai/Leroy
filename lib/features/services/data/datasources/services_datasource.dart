import 'package:flutter/material.dart';
import 'package:leroy_ai/features/services/domain/entities/service_entity.dart';

/// Static catalog mirroring Leroy AI Solutions services (prices in ZAR).
class ServicesDataSource {
  const ServicesDataSource();

  /// WhatsApp sales number used on https://leroyai-ekygtaaq.manus.space
  static const String whatsAppNumber = '27692202159';

  static const List<ServiceEntity> catalog = [
    ServiceEntity(
      id: 'ai-chatbots',
      title: 'AI Chatbots',
      description:
          'Automate customer support and lead qualification 24/7',
      priceLabel: 'R2,000 setup + R500/month',
      icon: Icons.smart_toy_outlined,
    ),
    ServiceEntity(
      id: 'whatsapp-automation',
      title: 'WhatsApp Automation',
      description:
          'Streamline customer communication and sales follow-ups',
      priceLabel: 'R1,500/month',
      icon: Icons.chat_outlined,
    ),
    ServiceEntity(
      id: 'lead-generation',
      title: 'Lead Generation Systems',
      description: 'Attract and qualify leads automatically using AI',
      priceLabel: 'R2,500 setup + R800/month',
      icon: Icons.trending_up_rounded,
    ),
    ServiceEntity(
      id: 'business-process-automation',
      title: 'Business Process Automation',
      description:
          'Full-package automation for your entire business workflow',
      priceLabel: 'R5,000/month',
      icon: Icons.precision_manufacturing_outlined,
    ),
    ServiceEntity(
      id: 'we-build-apps',
      title: 'We Build Apps',
      description:
          'Custom Android and iOS apps designed for your business goals',
      priceLabel: 'R8,000 setup + R600/month',
      icon: Icons.phone_iphone_rounded,
      isFeatured: true,
    ),
    ServiceEntity(
      id: 'we-build-websites',
      title: 'We Build Websites',
      description:
          'Modern, conversion-focused websites that grow your brand online',
      priceLabel: 'R3,500 setup + R400/month',
      icon: Icons.language_rounded,
      isFeatured: true,
    ),
  ];

  Future<List<ServiceEntity>> getServices() async => catalog;

  /// Pre-filled WhatsApp enquiry for a specific service.
  Uri enquiryUri(ServiceEntity service) {
    final message = Uri.encodeComponent(
      'Hello Leroy AI Solutions, I\'m interested in "${service.title}" '
      '(${service.priceLabel}). Please assist me.',
    );
    return Uri.parse('https://wa.me/$whatsAppNumber?text=$message');
  }
}
