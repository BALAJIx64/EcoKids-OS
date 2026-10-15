import QtQuick
import QtQuick.Controls as QQC2
import QtQuick.Layouts
import org.kde.kirigami as Kirigami
import org.kde.plasma.plasmoid
import org.kde.plasma.core as PlasmaCore
import org.kde.plasma.components as PlasmaComponents3

PlasmoidItem {
    id: root

    preferredRepresentation: fullRepresentation
    implicitWidth: 300
    implicitHeight: 380

    fullRepresentation: Item {
        id: container
        anchors.fill: parent

        property bool showDetails: false
        property int currentTipIndex: 0
        readonly property var ecoTips: [
            "Switching off unused lights saves clean energy!",
            "Recycling 1 ton of paper saves 17 trees!",
            "Solar panels turn sunshine into green power!",
            "Walking or cycling keeps our sky clean and blue!",
            "Planting a tiny seed creates a home for friendly wildlife!"
        ]

        // Glassmorphism card container
        Rectangle {
            id: cardBg
            anchors.fill: parent
            anchors.margins: 6
            radius: 20
            color: Qt.rgba(0.06, 0.14, 0.11, 0.88) // Deep moss slate with subtle translucency
            border.color: container.showDetails ? "#2ec4b6" : Qt.rgba(0.18, 0.77, 0.42, 0.6)
            border.width: 1.5

            // Subtle outer glow effect
            Rectangle {
                anchors.fill: parent
                anchors.margins: -1
                radius: cardBg.radius + 1
                color: "transparent"
                border.color: Qt.rgba(0.29, 0.85, 0.58, 0.25)
                border.width: 1
            }

            ColumnLayout {
                anchors.fill: parent
                anchors.margins: 14
                spacing: 10

                // Header
                RowLayout {
                    Layout.fillWidth: true
                    spacing: 8

                    Rectangle {
                        width: 10
                        height: 10
                        radius: 5
                        color: "#2ecc71"
                        
                        SequentialAnimation on opacity {
                            loops: Animation.Infinite
                            running: true
                            NumberAnimation { to: 0.3; duration: 1200; easing.type: Easing.InOutQuad }
                            NumberAnimation { to: 1.0; duration: 1200; easing.type: Easing.InOutQuad }
                        }
                    }

                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: 1

                        Text {
                            text: "EcoKids Living World"
                            font.pixelSize: 13
                            font.bold: true
                            color: "#ffffff"
                        }

                        Text {
                            text: "Miniature Biome: Archipelago"
                            font.pixelSize: 10
                            color: "#2ec4b6"
                        }
                    }

                    // Interactive info toggle button
                    Rectangle {
                        width: 26
                        height: 26
                        radius: 13
                        color: toggleMouse.containsMouse ? "#20bf6b" : Qt.rgba(0.13, 0.24, 0.20, 0.9)
                        border.color: "#2ec4b6"
                        border.width: 1

                        Text {
                            anchors.centerIn: parent
                            text: container.showDetails ? "✕" : "ℹ"
                            color: "#ffffff"
                            font.pixelSize: 11
                            font.bold: true
                        }

                        MouseArea {
                            id: toggleMouse
                            anchors.fill: parent
                            hoverEnabled: true
                            cursorShape: Qt.PointingHandCursor
                            onClicked: container.showDetails = !container.showDetails
                        }
                    }
                }

                // Central Interactive Living Planet Stage
                Item {
                    id: planetStage
                    Layout.fillWidth: true
                    Layout.preferredHeight: 180
                    clip: true

                    // Atmospheric Aurora Halo Ring
                    Rectangle {
                        id: auroraHalo
                        anchors.centerIn: parent
                        width: 154
                        height: 154
                        radius: 77
                        color: "transparent"
                        border.color: "#20bf6b"
                        border.width: 3
                        opacity: 0.65

                        SequentialAnimation on opacity {
                            loops: Animation.Infinite
                            running: true
                            NumberAnimation { to: 0.95; duration: 2400; easing.type: Easing.InOutSine }
                            NumberAnimation { to: 0.35; duration: 2400; easing.type: Easing.InOutSine }
                        }

                        SequentialAnimation on scale {
                            loops: Animation.Infinite
                            running: true
                            NumberAnimation { to: 1.05; duration: 3200; easing.type: Easing.InOutSine }
                            NumberAnimation { to: 0.98; duration: 3200; easing.type: Easing.InOutSine }
                        }
                    }

                    // Floating Bio-Spores (Particle Emulation)
                    Repeater {
                        model: 5
                        Rectangle {
                            id: spore
                            width: 4
                            height: 4
                            radius: 2
                            color: "#feca57"
                            opacity: 0.7

                            readonly property real startX: planetStage.width / 2 + (index * 26 - 52)
                            readonly property real startY: planetStage.height / 2 + 35

                            x: startX
                            y: startY

                            SequentialAnimation on y {
                                loops: Animation.Infinite
                                running: true
                                NumberAnimation {
                                    from: spore.startY
                                    to: spore.startY - 70 - (index * 8)
                                    duration: 2600 + (index * 450)
                                    easing.type: Easing.OutQuad
                                }
                            }

                            SequentialAnimation on opacity {
                                loops: Animation.Infinite
                                running: true
                                NumberAnimation { from: 0.0; to: 0.85; duration: 1000 }
                                NumberAnimation { from: 0.85; to: 0.0; duration: 1600 + (index * 450) }
                            }
                        }
                    }

                    // Planet Globe Masked Container
                    Rectangle {
                        id: planetWrapper
                        anchors.centerIn: parent
                        width: 140
                        height: 140
                        radius: 70
                        clip: true
                        color: "transparent"
                        border.color: Qt.rgba(0.3, 0.9, 0.6, 0.7)
                        border.width: 2

                        // Floating Bobbing Animation
                        SequentialAnimation on y {
                            loops: Animation.Infinite
                            running: true
                            NumberAnimation { to: planetWrapper.y - 6; duration: 2200; easing.type: Easing.InOutQuad }
                            NumberAnimation { to: planetWrapper.y + 4; duration: 2200; easing.type: Easing.InOutQuad }
                        }

                        Image {
                            id: planetImg
                            anchors.fill: parent
                            source: Qt.resolvedUrl("../assets/planet.jpg")
                            fillMode: Image.PreserveAspectCrop
                            smooth: true
                        }
                    }

                    // Interactive Planet Touch Area
                    MouseArea {
                        id: planetClickArea
                        anchors.fill: planetWrapper
                        hoverEnabled: true
                        cursorShape: Qt.PointingHandCursor
                        onClicked: {
                            // Cycle tip & toggle details
                            container.currentTipIndex = (container.currentTipIndex + 1) % container.ecoTips.length
                            container.showDetails = !container.showDetails
                        }
                    }
                }

                // Dynamic Environmental Status or Details View
                Item {
                    Layout.fillWidth: true
                    Layout.fillHeight: true

                    // Default View: Biome Purity & Quick Stats
                    ColumnLayout {
                        anchors.fill: parent
                        spacing: 6
                        visible: !container.showDetails

                        RowLayout {
                            Layout.fillWidth: true
                            Text {
                                text: "Biome Purity"
                                font.pixelSize: 11
                                font.bold: true
                                color: "#e0f2fe"
                            }
                            Item { Layout.fillWidth: true }
                            Text {
                                text: "94% Clean"
                                font.pixelSize: 11
                                font.bold: true
                                color: "#2ed573"
                            }
                        }

                        // Progress Bar
                        Rectangle {
                            Layout.fillWidth: true
                            height: 7
                            radius: 3.5
                            color: Qt.rgba(0.1, 0.2, 0.16, 0.8)

                            Rectangle {
                                width: parent.width * 0.94
                                height: parent.height
                                radius: 3.5
                                color: "#20bf6b"
                            }
                        }

                        // Mini Eco Fact Bubble
                        Rectangle {
                            Layout.fillWidth: true
                            Layout.preferredHeight: 46
                            radius: 10
                            color: Qt.rgba(0.08, 0.18, 0.14, 0.9)
                            border.color: Qt.rgba(0.18, 0.77, 0.42, 0.3)
                            border.width: 1

                            RowLayout {
                                anchors.fill: parent
                                anchors.margins: 8
                                spacing: 8

                                Text {
                                    text: "🌱"
                                    font.pixelSize: 14
                                }

                                Text {
                                    Layout.fillWidth: true
                                    text: container.ecoTips[container.currentTipIndex]
                                    font.pixelSize: 10
                                    color: "#f1f5f9"
                                    wrapMode: Text.WordWrap
                                    elide: Text.ElideRight
                                    maximumLineCount: 2
                                }
                            }

                            MouseArea {
                                anchors.fill: parent
                                cursorShape: Qt.PointingHandCursor
                                onClicked: container.currentTipIndex = (container.currentTipIndex + 1) % container.ecoTips.length
                            }
                        }
                    }

                    // Detailed Planet Status HUD (When clicked / toggled)
                    ColumnLayout {
                        anchors.fill: parent
                        spacing: 4
                        visible: container.showDetails

                        Rectangle {
                            Layout.fillWidth: true
                            Layout.fillHeight: true
                            radius: 10
                            color: Qt.rgba(0.07, 0.16, 0.13, 0.95)
                            border.color: "#2ec4b6"
                            border.width: 1

                            ColumnLayout {
                                anchors.fill: parent
                                anchors.margins: 8
                                spacing: 4

                                Text {
                                    text: "🌍 Planet Vitals (Prototype)"
                                    font.pixelSize: 11
                                    font.bold: true
                                    color: "#2ec4b6"
                                }

                                Text {
                                    text: "• Solar & Wind Domes: 100% Active"
                                    font.pixelSize: 10
                                    color: "#f1f5f9"
                                }
                                Text {
                                    text: "• Archipelago Waters: Pure (0% Waste)"
                                    font.pixelSize: 10
                                    color: "#f1f5f9"
                                }
                                Text {
                                    text: "• Wildlife Habitats: Thriving"
                                    font.pixelSize: 10
                                    color: "#f1f5f9"
                                }

                                Text {
                                    Layout.fillWidth: true
                                    text: "Connects to Eco Engine & XP in Phase 5"
                                    font.pixelSize: 9
                                    font.italic: true
                                    color: "#feca57"
                                    horizontalAlignment: Text.AlignHCenter
                                }
                            }
                        }
                    }
                }

                // Footer Prototype Notice
                Text {
                    Layout.fillWidth: true
                    text: "Click planet to toggle HUD • Tap tip for facts"
                    font.pixelSize: 9
                    color: Qt.rgba(0.6, 0.8, 0.7, 0.6)
                    horizontalAlignment: Text.AlignHCenter
                }
            }
        }
    }
}
