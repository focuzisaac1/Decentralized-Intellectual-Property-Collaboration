;; project-registration.clar
;; Records details of collaborative creative works

;; Error codes
(define-constant ERR_NOT_AUTHORIZED (err u100))
(define-constant ERR_PROJECT_EXISTS (err u101))
(define-constant ERR_PROJECT_NOT_FOUND (err u102))

;; Data structures
(define-map projects
  { project-id: uint }
  {
    title: (string-utf8 256),
    description: (string-utf8 1024),
    creator: principal,
    created-at: uint,
    metadata-url: (optional (string-utf8 256))
  }
)

(define-map project-owners
  { project-id: uint }
  { owner: principal }
)

(define-data-var next-project-id uint u1)

;; Public functions
(define-public (register-project
                (title (string-utf8 256))
                (description (string-utf8 1024))
                (metadata-url (optional (string-utf8 256))))
  (let ((project-id (var-get next-project-id)))
    (asserts! (is-none (map-get? projects { project-id: project-id })) ERR_PROJECT_EXISTS)

    (map-set projects
      { project-id: project-id }
      {
        title: title,
        description: description,
        creator: tx-sender,
        created-at: block-height,
        metadata-url: metadata-url
      }
    )

    (map-set project-owners
      { project-id: project-id }
      { owner: tx-sender }
    )

    (var-set next-project-id (+ project-id u1))
    (ok project-id)
  )
)

(define-public (update-project
                (project-id uint)
                (title (string-utf8 256))
                (description (string-utf8 1024))
                (metadata-url (optional (string-utf8 256))))
  (let ((project (map-get? projects { project-id: project-id }))
        (owner-data (map-get? project-owners { project-id: project-id })))

    (asserts! (is-some project) ERR_PROJECT_NOT_FOUND)
    (asserts! (is-some owner-data) ERR_PROJECT_NOT_FOUND)
    (asserts! (is-eq tx-sender (get owner (unwrap! owner-data ERR_PROJECT_NOT_FOUND))) ERR_NOT_AUTHORIZED)

    (map-set projects
      { project-id: project-id }
      {
        title: title,
        description: description,
        creator: (get creator (unwrap! project ERR_PROJECT_NOT_FOUND)),
        created-at: (get created-at (unwrap! project ERR_PROJECT_NOT_FOUND)),
        metadata-url: metadata-url
      }
    )

    (ok true)
  )
)

(define-public (transfer-ownership (project-id uint) (new-owner principal))
  (let ((owner-data (map-get? project-owners { project-id: project-id })))
    (asserts! (is-some owner-data) ERR_PROJECT_NOT_FOUND)
    (asserts! (is-eq tx-sender (get owner (unwrap! owner-data ERR_PROJECT_NOT_FOUND))) ERR_NOT_AUTHORIZED)

    (map-set project-owners
      { project-id: project-id }
      { owner: new-owner }
    )

    (ok true)
  )
)

;; Read-only functions
(define-read-only (get-project (project-id uint))
  (map-get? projects { project-id: project-id })
)

(define-read-only (get-project-owner (project-id uint))
  (map-get? project-owners { project-id: project-id })
)

(define-read-only (get-next-project-id)
  (var-get next-project-id)
)
