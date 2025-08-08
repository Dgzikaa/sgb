// Utilitários para integração com Apple Wallet e Google Pay

export interface WalletCardData {
  memberName: string;
  memberEmail: string;
  membershipId: string;
  qrToken: string;
  balance: number;
  status: string;
  expiryDate?: string;
}

// Apple Wallet (PassKit)
export const generateAppleWalletPass = async (cardData: WalletCardData) => {
  try {
    // Em produção, isso seria feito no backend com certificados da Apple
    const passData = {
      formatVersion: 1,
      passTypeIdentifier: "pass.com.ordinariobar.fidelidade",
      serialNumber: cardData.membershipId,
      teamIdentifier: "XXXXXXXXXX", // Seu Team ID da Apple
      organizationName: "Ordinário Bar",
      description: "Cartão Fidelidade VIP",
      logoText: "Ordinário Bar",
      foregroundColor: "rgb(255, 255, 255)",
      backgroundColor: "rgb(245, 158, 11)", // amber-500
      labelColor: "rgb(255, 255, 255)",
      
      // Informações do cartão
      generic: {
        primaryFields: [
          {
            key: "balance",
            label: "Saldo Disponível",
            value: `R$ ${cardData.balance.toFixed(2)}`
          }
        ],
        secondaryFields: [
          {
            key: "member",
            label: "Membro",
            value: cardData.memberName
          },
          {
            key: "status",
            label: "Status",
            value: cardData.status.toUpperCase()
          }
        ],
        auxiliaryFields: [
          {
            key: "membershipId",
            label: "ID",
            value: cardData.membershipId.substring(0, 8)
          }
        ]
      },
      
      // QR Code para check-in
      barcode: {
        message: cardData.qrToken,
        format: "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1"
      },
      
      // Localização do bar para notificações
      locations: [
        {
          latitude: -15.7801, // Coordenadas do Ordinário Bar em Brasília
          longitude: -47.9292,
          relevantText: "Bem-vindo ao Ordinário Bar! Use seu cartão VIP."
        }
      ],
      
      // Estilo visual
      storeCard: {
        primaryFields: [
          {
            key: "balance",
            label: "Créditos",
            value: `R$ ${cardData.balance.toFixed(2)}`
          }
        ]
      }
    };

    // Em produção, enviaria para seu backend que geraria o .pkpass
    console.log('Dados do passe Apple Wallet:', passData);
    
    // Por enquanto, simular download
    alert('Apple Wallet: Em produção, o arquivo .pkpass seria baixado automaticamente!');
    
    return passData;
  } catch (error) {
    console.error('Erro ao gerar passe Apple Wallet:', error);
    throw error;
  }
};

// Google Pay (Wallet API)
export const generateGooglePayPass = async (cardData: WalletCardData) => {
  try {
    // Dados para Google Pay Wallet API
    const objectData = {
      "id": `${process.env.NEXT_PUBLIC_GOOGLE_PAY_ISSUER_ID}.${cardData.membershipId}`,
      "classId": `${process.env.NEXT_PUBLIC_GOOGLE_PAY_ISSUER_ID}.ordinario_fidelidade`,
      "state": "ACTIVE",
      "heroImage": {
        "sourceUri": {
          "uri": "https://ordinariobar.com/wallet-hero.png"
        }
      },
      "textModulesData": [
        {
          "id": "member_name",
          "header": "Membro VIP",
          "body": cardData.memberName
        },
        {
          "id": "balance",
          "header": "Saldo Disponível",
          "body": `R$ ${cardData.balance.toFixed(2)}`
        }
      ],
      "barcode": {
        "type": "QR_CODE",
        "value": cardData.qrToken,
        "alternateText": cardData.membershipId
      },
      "cardTitle": {
        "defaultValue": {
          "language": "pt",
          "value": "Fidelidade VIP"
        }
      },
      "subheader": {
        "defaultValue": {
          "language": "pt", 
          "value": "Ordinário Bar"
        }
      },
      "header": {
        "defaultValue": {
          "language": "pt",
          "value": cardData.memberName
        }
      }
    };

    // Em produção, isso seria feito via Google Wallet API
    console.log('Dados do passe Google Pay:', objectData);
    
    // Por enquanto, simular
    alert('Google Pay: Em produção, seria adicionado automaticamente à carteira!');
    
    return objectData;
  } catch (error) {
    console.error('Erro ao gerar passe Google Pay:', error);
    throw error;
  }
};

// Detectar tipo de dispositivo
export const getDeviceType = (): 'ios' | 'android' | 'desktop' => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  } else if (/android/.test(userAgent)) {
    return 'android';
  } else {
    return 'desktop';
  }
};

// Função principal para adicionar à wallet
export const addToWallet = async (cardData: WalletCardData) => {
  const deviceType = getDeviceType();
  
  try {
    switch (deviceType) {
      case 'ios':
        await generateAppleWalletPass(cardData);
        break;
      case 'android':
        await generateGooglePayPass(cardData);
        break;
      case 'desktop':
        // Para desktop, oferecer download do QR Code
        const qrCodeData = `data:text/plain;charset=utf-8,${encodeURIComponent(cardData.qrToken)}`;
        const link = document.createElement('a');
        link.href = qrCodeData;
        link.download = `cartao-vip-${cardData.membershipId}.txt`;
        link.click();
        alert('QR Code salvo! Para dispositivos móveis, acesse este link no seu smartphone.');
        break;
    }
  } catch (error) {
    console.error('Erro ao adicionar à wallet:', error);
    throw error;
  }
};

// Verificar se o dispositivo suporta wallet
export const supportsWallet = (): boolean => {
  const deviceType = getDeviceType();
  return deviceType === 'ios' || deviceType === 'android';
};

// Gerar URL de adição à wallet para compartilhamento
export const generateWalletShareUrl = (cardData: WalletCardData): string => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ordinariobar.com';
  return `${baseUrl}/fidelidade/cartao-digital?member=${cardData.membershipId}&token=${cardData.qrToken}`;
};
